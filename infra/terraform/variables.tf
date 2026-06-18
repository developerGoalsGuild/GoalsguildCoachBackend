variable "aws_region" {
  description = "AWS region for frontend/global-adjacent resources such as S3 and CloudFront management."
  type        = string
  default     = "us-east-1"
}

variable "backend_region" {
  description = "AWS region for regional backend resources such as Lambda, API Gateway, DynamoDB, and SSM."
  type        = string
  default     = ""
}

variable "localstack_enabled" {
  description = "Enable LocalStack provider endpoints and test credentials."
  type        = bool
  default     = false
}

variable "localstack_endpoint" {
  description = "LocalStack edge endpoint URL."
  type        = string
  default     = "http://127.0.0.1:4566"
}

variable "project" {
  description = "Project slug used for naming."
  type        = string
  default     = "goalsguild"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "allowed_origins" {
  description = "CORS allowed origins for API Gateway."
  type        = list(string)
  default     = ["https://www.goalsguild.com"]
}

variable "jwt_secret" {
  description = "JWT signing secret for license session tokens."
  type        = string
  sensitive   = true
}

variable "cache_validation_secret" {
  description = "HMAC secret for cached validation blobs."
  type        = string
  sensitive   = true
}

variable "source_email" {
  description = "SES verified sender email."
  type        = string
  default     = ""
}

variable "ses_region" {
  description = "AWS region where SES sender identities are verified and email is sent."
  type        = string
  default     = "us-east-2"
}

variable "allow_insecure_defaults" {
  description = "Set true only for local/dev experiments."
  type        = bool
  default     = false
}

variable "admin_auth_mode" {
  description = "Admin API auth mode: secret header or IAM."
  type        = string
  default     = "secret"
  validation {
    condition     = contains(["secret", "iam"], var.admin_auth_mode)
    error_message = "admin_auth_mode must be one of: secret or iam."
  }
}

variable "admin_assume_role_principals" {
  description = "IAM principal ARNs allowed to assume the generated admin invoke role when admin_auth_mode=iam."
  type        = list(string)
  default     = []
}

variable "app_version" {
  description = "Release version used in S3 artifact paths."
  type        = string
  default     = "1.1.0"
}

variable "mac_artifacts_dir" {
  description = "Local directory containing macOS build artifacts to upload."
  type        = string
  default     = ""
}

variable "windows_artifacts_dir" {
  description = "Local directory containing Windows build artifacts to upload."
  type        = string
  default     = ""
}

variable "stripe_secret_key" {
  description = "Deprecated and unused. Keep Stripe Secret Key in SSM and set stripe_secret_key_param instead."
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_secret_key_param" {
  description = "SSM parameter name containing the Stripe Secret Key."
  type        = string
  default     = ""
}

variable "stripe_price_id" {
  description = "Deprecated and unused. Keep Stripe Price ID in SSM and set stripe_price_id_param instead."
  type        = string
  default     = ""
}

variable "stripe_price_id_param" {
  description = "SSM parameter name containing the Stripe Price ID for checkout."
  type        = string
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Deprecated and unused. Keep Stripe Webhook Secret in SSM and set stripe_webhook_secret_param instead."
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret_param" {
  description = "SSM parameter name containing the Stripe Webhook Secret."
  type        = string
  default     = ""
}

variable "frontend_url" {
  description = "Frontend URL for checkout redirects."
  type        = string
  default     = "https://www.goalsguild.com"
}

variable "cloudfront_aliases" {
  description = "Custom domain aliases for the frontend CloudFront distribution."
  type        = list(string)
  default     = []
}

variable "cloudfront_acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for CloudFront custom domain aliases."
  type        = string
  default     = ""
}

variable "api_throttle_rate_limit" {
  description = "API Gateway default throttling rate limit (requests per second)."
  type        = number
  default     = 20
}

variable "api_throttle_burst_limit" {
  description = "API Gateway default throttling burst limit."
  type        = number
  default     = 40
}

variable "webhook_throttle_rate_limit" {
  description = "API Gateway throttling rate for webhook route."
  type        = number
  default     = 10
}

variable "webhook_throttle_burst_limit" {
  description = "API Gateway throttling burst for webhook route."
  type        = number
  default     = 20
}

variable "waf_rate_limit" {
  description = "WAF rate-based limit (requests per 5 min per IP) for production."
  type        = number
  default     = 2000
}

variable "lambda_log_retention_days" {
  description = "CloudWatch log retention (days) for Lambda log groups."
  type        = number
  default     = 14
}

variable "trial_days" {
  description = "Number of days for trial licenses."
  type        = number
  default     = 7
  validation {
    condition     = var.trial_days >= 1 && floor(var.trial_days) == var.trial_days
    error_message = "trial_days must be an integer >= 1."
  }
}

variable "quicksight_dashboard_enabled" {
  description = "When true, provisions the analytics export pipeline (S3, Glue, Athena) and a QuickSight dashboard fed by the licenses DynamoDB table."
  type        = bool
  default     = false
}

variable "quicksight_principal_arn" {
  description = "ARN of the QuickSight user or group granted owner permissions on the dashboard, dataset, and data source. Required when quicksight_dashboard_enabled is true."
  type        = string
  default     = ""
}

variable "analytics_export_schedule" {
  description = "EventBridge schedule expression that triggers the analytics export Lambda when quicksight_dashboard_enabled is true."
  type        = string
  default     = "rate(1 day)"
}

variable "analytics_include_email" {
  description = "When false (default), the analytics export hashes raw email addresses. Set to true only if QuickSight viewers should see plain emails."
  type        = bool
  default     = false
}

variable "analytics_export_lookback_days" {
  description = "Maximum age in days for download events included in each analytics export run. Older download events are skipped."
  type        = number
  default     = 365
  validation {
    condition     = var.analytics_export_lookback_days >= 1 && floor(var.analytics_export_lookback_days) == var.analytics_export_lookback_days
    error_message = "analytics_export_lookback_days must be an integer >= 1."
  }
}
