#!/bin/bash
set -euo pipefail
umask 077
export AWS_PAGER=""

echo "=================================================="
echo "🚀 Deploying GoalsGuild Coach to Production AWS"
echo "=================================================="

for cmd in terraform aws npm python3; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "❌ Error: Required command '$cmd' is not installed or not in PATH."
        exit 1
    fi
done

if [ ! -f infra/terraform/environments/prod.tfvars ]; then
    echo "❌ Error: infra/terraform/environments/prod.tfvars not found!"
    echo "Please copy infra/terraform/environments/prod.tfvars.example to prod.tfvars and fill in your live secrets."
    exit 1
fi

APP_VERSION="$(tr -d '[:space:]' < VERSION 2>/dev/null || echo "1.1.0")"
ARTIFACTS_DIR="${ARTIFACTS_DIR:-../artifacts}"

cd infra/terraform
echo "☁️  1. Deploying AWS Infrastructure via Terraform..."
terraform init
terraform workspace select prod || terraform workspace new prod
terraform apply -auto-approve -var-file="environments/prod.tfvars"

# Get outputs
LICENSE_API_URL=$(terraform output -raw license_api_url)
BACKEND_REGION=$(terraform output -raw backend_region)
DYNAMODB_TABLE=$(terraform output -raw dynamodb_table_name)
FRONTEND_API_BASE_URL=$(terraform output -raw frontend_api_base_url)
FRONTEND_BUCKET=$(terraform output -raw frontend_s3_bucket)
CLOUDFRONT_URL=$(terraform output -raw frontend_cloudfront_url)
FRONTEND_PUBLIC_URL=$(terraform output -raw frontend_public_url)
CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw frontend_cloudfront_distribution_id)
MAC_RELEASE_PREFIX=$(terraform output -raw mac_release_prefix)
WINDOWS_RELEASE_PREFIX=$(terraform output -raw windows_release_prefix)
STRIPE_SECRET_KEY_PARAM=$(terraform output -raw stripe_secret_key_param_name)
STRIPE_PRICE_ID_PARAM=$(terraform output -raw stripe_price_id_param_name)
STRIPE_WEBHOOK_SECRET_PARAM=$(terraform output -raw stripe_webhook_secret_param_name)
OLD_BACKEND_REGION="${OLD_BACKEND_REGION:-us-east-1}"

echo "🔐 2. Validating required Stripe SSM parameters..."
copy_ssm_if_missing() {
    local name="$1"
    local type="$2"

    if aws ssm get-parameter --region "$BACKEND_REGION" --name "$name" --with-decryption >/dev/null 2>&1; then
        return
    fi

    if [ "$OLD_BACKEND_REGION" = "$BACKEND_REGION" ]; then
        return
    fi

    echo "↪️  Copying missing SSM parameter $name from $OLD_BACKEND_REGION to $BACKEND_REGION..."
    local value
    value=$(aws ssm get-parameter --region "$OLD_BACKEND_REGION" --name "$name" --with-decryption --query 'Parameter.Value' --output text)
    aws ssm put-parameter --region "$BACKEND_REGION" --name "$name" --type "$type" --value "$value" --overwrite >/dev/null
}

copy_ssm_if_missing "$STRIPE_SECRET_KEY_PARAM" "SecureString"
copy_ssm_if_missing "$STRIPE_PRICE_ID_PARAM" "String"
copy_ssm_if_missing "$STRIPE_WEBHOOK_SECRET_PARAM" "SecureString"

aws ssm get-parameter --region "$BACKEND_REGION" --name "$STRIPE_SECRET_KEY_PARAM" --with-decryption >/dev/null
aws ssm get-parameter --region "$BACKEND_REGION" --name "$STRIPE_PRICE_ID_PARAM" >/dev/null
aws ssm get-parameter --region "$BACKEND_REGION" --name "$STRIPE_WEBHOOK_SECRET_PARAM" --with-decryption >/dev/null

if [ "$OLD_BACKEND_REGION" != "$BACKEND_REGION" ]; then
    echo "🗃️  Migrating DynamoDB data from $OLD_BACKEND_REGION to $BACKEND_REGION..."
    python3 - "$OLD_BACKEND_REGION" "$BACKEND_REGION" "$DYNAMODB_TABLE" <<'PY'
import json
import subprocess
import sys

old_region, new_region, table_name = sys.argv[1:4]


def aws_json(*args: str) -> dict:
    completed = subprocess.run(
        ["aws", *args],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
    )
    return json.loads(completed.stdout or "{}")


def put_batch(items: list[dict]) -> None:
    if not items:
        return
    payload = {table_name: [{"PutRequest": {"Item": item}} for item in items]}
    subprocess.run(
        [
            "aws",
            "dynamodb",
            "batch-write-item",
            "--region",
            new_region,
            "--request-items",
            json.dumps(payload),
        ],
        check=True,
    )


last_key = None
migrated = 0
while True:
    args = ["dynamodb", "scan", "--region", old_region, "--table-name", table_name]
    if last_key:
        args.extend(["--exclusive-start-key", json.dumps(last_key)])
    page = aws_json(*args)
    items = page.get("Items", [])
    for index in range(0, len(items), 25):
        put_batch(items[index : index + 25])
    migrated += len(items)
    last_key = page.get("LastEvaluatedKey")
    if not last_key:
        break

print(f"Migrated {migrated} DynamoDB items from {old_region} to {new_region}.")
PY
fi

echo "📦 3. Building static landing page with production API URL..."
cd ../../landing
npm ci
echo "🧹 Cleaning previous Next.js build artifacts..."
rm -rf .next out
export NEXT_PUBLIC_APP_URL="${FRONTEND_PUBLIC_URL}"
export NEXT_PUBLIC_BASE_PATH=""
export NEXT_PUBLIC_LICENSE_API_URL="${FRONTEND_API_BASE_URL}"
npm run build

echo "📤 4. Syncing landing page to AWS S3..."
aws s3 sync out/ s3://$FRONTEND_BUCKET --delete
MAC_DMG="${ARTIFACTS_DIR}/GoalsGuild Coach-${APP_VERSION}-arm64.dmg"
if [ -f "$MAC_DMG" ]; then
    aws s3 cp "$MAC_DMG" "${MAC_RELEASE_PREFIX}GoalsGuild Coach-${APP_VERSION}-arm64.dmg" \
        --content-type "application/x-apple-diskimage" \
        --content-disposition "attachment; filename=\"GoalsGuild Coach-${APP_VERSION}-arm64.dmg\""
fi
MAC_INTEL_DMG="${ARTIFACTS_DIR}/GoalsGuild Coach-${APP_VERSION}-x86_64.dmg"
if [ -f "$MAC_INTEL_DMG" ]; then
    aws s3 cp "$MAC_INTEL_DMG" "${MAC_RELEASE_PREFIX}GoalsGuild Coach-${APP_VERSION}-x86_64.dmg" \
        --content-type "application/x-apple-diskimage" \
        --content-disposition "attachment; filename=\"GoalsGuild Coach-${APP_VERSION}-x86_64.dmg\""
fi
WINDOWS_INSTALLER="${ARTIFACTS_DIR}/GoalsGuild Coach-${APP_VERSION}-windows-x86_64.msi"
if [ -f "$WINDOWS_INSTALLER" ]; then
    aws s3 cp "$WINDOWS_INSTALLER" "${WINDOWS_RELEASE_PREFIX}GoalsGuild Coach-${APP_VERSION}-windows-x86_64.msi" \
        --content-type "application/octet-stream" \
        --content-disposition "attachment; filename=\"GoalsGuild Coach-${APP_VERSION}-windows-x86_64.msi\""
fi

echo "🧼 5. Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" >/dev/null

echo "=================================================="
echo "✅ Production Deployment Complete!"
echo "🌐 Landing Page URL: $CLOUDFRONT_URL"
echo "🔌 License API URL:  $LICENSE_API_URL"
echo "🔐 Frontend API Base: $FRONTEND_API_BASE_URL"
echo "=================================================="
echo "Next steps:"
echo "1. Point your custom domain to the CloudFront URL in your DNS settings."
echo "2. Update your Stripe Webhook in the Stripe Dashboard to point to: $FRONTEND_API_BASE_URL/webhook"
