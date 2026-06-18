# GoalsGuild AWS Terraform

Deploys core license infrastructure on AWS:
- DynamoDB table + GSIs
- Lambda functions (all handlers under `infra/lambdas`)
- API Gateway HTTP API routes
- S3 prompt bucket
- SSM secure parameters for secrets
- Versioned app release bucket for macOS and Windows installers

## Usage

```bash
cd infra/terraform
terraform init
terraform apply \
  -var="environment=prod" \
  -var="aws_region=us-east-1" \
  -var="trial_days=7" \
  -var="admin_auth_mode=iam" \
  -var='admin_assume_role_principals=["arn:aws:iam::123456789012:role/platform-admin"]' \
  -var="app_version=1.1.0" \
  -var="allowed_origins=[\"https://your-landing-domain.com\"]" \
  -var="jwt_secret=REPLACE_ME" \
  -var="cache_validation_secret=REPLACE_ME" \
  -var="source_email=licenses@your-domain.com" \
  -var="mac_artifacts_dir=../../dist/mac" \
  -var="windows_artifacts_dir=../../dist/windows"
```

Stripe checkout/webhook config is read by Lambda from SSM at runtime. Create these parameters before applying or invoking checkout:

```bash
aws ssm put-parameter --name /goalsguild/prod/stripe_secret_key --type SecureString --value sk_live_... --overwrite
aws ssm put-parameter --name /goalsguild/prod/stripe_price_id --type String --value price_... --overwrite
aws ssm put-parameter --name /goalsguild/prod/stripe_webhook_secret --type SecureString --value whsec_... --overwrite
```

By default, Terraform uses `/goalsguild/<environment>/stripe_secret_key`, `/goalsguild/<environment>/stripe_price_id`, and `/goalsguild/<environment>/stripe_webhook_secret`. Override with `stripe_secret_key_param`, `stripe_price_id_param`, and `stripe_webhook_secret_param` if you keep Stripe values under different SSM names.

## Production Deploy Flow (CloudFront default URL)

1. Copy `infra/terraform/environments/prod.tfvars.example` to `infra/terraform/environments/prod.tfvars` and fill required values.
2. Ensure Stripe SSM parameters exist for the selected `environment`.
3. Run `./deploy_prod.sh` from repo root.

The deploy script now:
- applies Terraform with `environments/prod.tfvars`
- verifies required Stripe SSM parameters are readable
- builds landing with:
  - `NEXT_PUBLIC_APP_URL` = `frontend_cloudfront_url`
  - `NEXT_PUBLIC_BASE_PATH` = empty
  - `NEXT_PUBLIC_LICENSE_API_URL` = `frontend_api_base_url`
- syncs `landing/out` to the frontend S3 bucket
- creates a CloudFront invalidation (`/*`)

After apply, copy outputs as follows:
- desktop `.env` as `LICENSE_API_URL`
- landing `.env.local` as `NEXT_PUBLIC_LICENSE_API_URL` (use `frontend_api_base_url`; this is CloudFront `/api` on AWS and direct API Gateway on LocalStack)

Release artifacts are uploaded automatically when directories are provided:
- `s3://<app_releases_bucket>/mac/<app_version>/...`
- `s3://<app_releases_bucket>/windows/<app_version>/...`

`admin_auth_mode` controls admin endpoint protection at API Gateway:
- `secret` (default): Lambda verifies `x-admin-secret`.
- `iam`: API Gateway enforces `AWS_IAM` on `/admin/*` routes (keep Lambda secret checks as defense in depth).

When `admin_auth_mode=iam`, Terraform also creates:
- `admin_api_invoke_policy_arn`: policy limited to `GET /admin/licenses` and `POST /admin/revoke`.
- `admin_api_invoke_role_arn` (optional): created only if `admin_assume_role_principals` is non-empty.

Attach/assume that role (or attach the policy to an existing principal), then sign requests with SigV4.

## Security hardening

- CloudFront has two origins: static S3 + API Gateway (`/api/*` behavior).
- CloudFront injects `x-origin-secret` on `/api/*`; public Lambda handlers reject requests without this secret.
- CloudFront attaches a managed response headers policy (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy).
- API Gateway stage throttling is enabled via:
  - `api_throttle_rate_limit`, `api_throttle_burst_limit`
  - `webhook_throttle_rate_limit`, `webhook_throttle_burst_limit`
- WAF is created only for production (`environment=prod` and `localstack_enabled=false`), with:
  - AWS Managed Common Rule Set
  - rate-based rule (`waf_rate_limit`)
- Lambda SSM IAM access is scoped to explicit parameter ARNs (including Stripe parameter names) in the active AWS account.
- Note: API Gateway HTTP API does not support classic Usage Plans/API Keys; throttling is enforced at stage/route level.

## LocalStack

To deploy to LocalStack instead of AWS:

```bash
cd infra/terraform
terraform init
terraform apply \
  -var="environment=local" \
  -var="localstack_enabled=true" \
  -var="localstack_endpoint=http://192.168.68.108:4566" \
  -var="trial_days=1" \
  -var="allowed_origins=[\"https://www.goalsguild.com\"]" \
  -var="jwt_secret=local-jwt-secret" \
  -var="cache_validation_secret=local-cache-secret" \
  -var="allow_insecure_defaults=true"
```

`trial_days` is stored in SSM at `/goalsguild/<environment>/trial_days` and read by the trial activation Lambda at runtime.
Stripe values are read from the same environment-scoped SSM path by default.

Production webhook endpoint in Stripe Dashboard:
- `https://<your-cloudfront-domain>/api/webhook` (or your custom domain if fronting the same distribution)

## QuickSight licenses dashboard (opt-in)

The `quicksight_dashboard_enabled` variable provisions a small analytics pipeline:

- a private S3 bucket (`analytics_bucket_name` output) that stores license and download snapshots and Athena query results,
- a Lambda (`<project>-<env>-analytics-export`) that scans the licenses table on the schedule set by `analytics_export_schedule` and writes JSONL partitioned by `snapshot_date=YYYY-MM-DD`,
- Glue tables `licenses` and `downloads` over the bucket,
- an Athena workgroup whose results land in the same bucket,
- a QuickSight Athena data source, two datasets, and a starter dashboard with KPIs and bar/pie charts for downloads and licenses.

Defaults are conservative:

- emails are stored as `email_hash` and `email_domain`. Set `analytics_include_email = true` only if QuickSight viewers should see plain emails.
- `analytics_export_lookback_days` (default `365`) caps how far back download events are exported.
- the `quicksight_*` resources are skipped on LocalStack and require both `quicksight_dashboard_enabled = true` and a `quicksight_principal_arn` from a registered QuickSight user/group.

The download Lambda (`GET /api/download`) records each successful presigned URL as `PK = DOWNLOAD#YYYY-MM-DD`, `SK = REQUEST#<iso>#<request_id>` in the same DynamoDB table, with `release_key`, `app_version`, `platform`, and a coarse `user_agent_class`. Recording errors are logged and never block the redirect.

QuickSight prerequisites that Terraform cannot create:

- a QuickSight Enterprise account in the same region as the Athena workgroup,
- a QuickSight user or group ARN supplied as `quicksight_principal_arn`,
- one-time access grants from QuickSight to S3, Athena, and Glue (configure once via the QuickSight admin console: Manage QuickSight -> Security & permissions). Grant access to the analytics S3 bucket and to Amazon Athena.

Useful outputs after apply:

- `analytics_bucket_name`, `analytics_export_lambda_name`, `analytics_glue_database`, `analytics_athena_workgroup`,
- `quicksight_dashboard_id`, `quicksight_dashboard_arn` (only when the dashboard is enabled).
