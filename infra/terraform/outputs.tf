output "license_api_url" {
  description = "Base URL for the license HTTP API."
  value       = var.localstack_enabled ? "${var.localstack_endpoint}/restapis/${aws_apigatewayv2_api.license.id}/$default/_user_request_" : aws_apigatewayv2_stage.default.invoke_url
}

output "backend_region" {
  description = "AWS region used for regional backend resources."
  value       = local.backend_region
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for licenses and verification tokens."
  value       = aws_dynamodb_table.licenses.name
}

output "prompt_bucket_name" {
  description = "S3 bucket name for encrypted prompt bundles."
  value       = aws_s3_bucket.prompts.bucket
}

output "app_releases_bucket_name" {
  description = "S3 bucket name for macOS/Windows release artifacts."
  value       = aws_s3_bucket.app_releases.bucket
}

output "mac_release_prefix" {
  description = "S3 prefix for macOS artifacts of selected app version."
  value       = "s3://${aws_s3_bucket.app_releases.bucket}/mac/${var.app_version}/"
}

output "windows_release_prefix" {
  description = "S3 prefix for Windows artifacts of selected app version."
  value       = "s3://${aws_s3_bucket.app_releases.bucket}/windows/${var.app_version}/"
}

output "admin_api_invoke_policy_arn" {
  description = "IAM policy ARN that grants invoke access to /admin/* routes when admin_auth_mode=iam."
  value       = try(aws_iam_policy.admin_api_invoke[0].arn, null)
}

output "frontend_cloudfront_url" {
  description = "CloudFront URL for the landing page."
  value       = var.localstack_enabled ? "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "frontend_public_url" {
  description = "Public frontend URL used for landing links and checkout redirects."
  value       = var.localstack_enabled ? "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}" : var.frontend_url
}

output "frontend_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidations."
  value       = var.localstack_enabled ? "" : aws_cloudfront_distribution.frontend.id
}

output "frontend_api_base_url" {
  description = "Frontend API base URL (CloudFront in AWS, API Gateway direct in LocalStack)."
  value       = var.localstack_enabled ? "${var.localstack_endpoint}/restapis/${aws_apigatewayv2_api.license.id}/$default/_user_request_" : "https://${aws_cloudfront_distribution.frontend.domain_name}/api"
}

output "stripe_secret_key_param_name" {
  description = "Effective SSM parameter name for Stripe Secret Key."
  value       = local.stripe_secret_key_param
}

output "stripe_price_id_param_name" {
  description = "Effective SSM parameter name for Stripe Price ID."
  value       = local.stripe_price_id_param
}

output "stripe_webhook_secret_param_name" {
  description = "Effective SSM parameter name for Stripe Webhook Secret."
  value       = local.stripe_webhook_secret_param
}

output "waf_web_acl_arn" {
  description = "WAF web ACL ARN (only in production)."
  value       = try(aws_wafv2_web_acl.frontend_prod[0].arn, null)
}

output "frontend_s3_bucket" {
  description = "S3 bucket for the static landing page files."
  value       = aws_s3_bucket.frontend.bucket
}

output "analytics_bucket_name" {
  description = "S3 bucket where the analytics export Lambda writes license and download snapshots. Null when QuickSight dashboard is disabled."
  value       = try(aws_s3_bucket.analytics[0].bucket, null)
}

output "analytics_export_lambda_name" {
  description = "Name of the scheduled Lambda that exports license and download analytics into S3."
  value       = try(aws_lambda_function.analytics_export[0].function_name, null)
}

output "analytics_glue_database" {
  description = "Glue database that QuickSight queries through Athena."
  value       = try(aws_glue_catalog_database.analytics[0].name, null)
}

output "analytics_athena_workgroup" {
  description = "Athena workgroup used by the QuickSight data source."
  value       = try(aws_athena_workgroup.analytics[0].name, null)
}

output "quicksight_dashboard_id" {
  description = "QuickSight dashboard ID. Null when the dashboard is disabled."
  value       = try(aws_quicksight_dashboard.licenses[0].dashboard_id, null)
}

output "quicksight_dashboard_arn" {
  description = "QuickSight dashboard ARN. Null when the dashboard is disabled."
  value       = try(aws_quicksight_dashboard.licenses[0].arn, null)
}
