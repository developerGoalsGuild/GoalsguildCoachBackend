terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  access_key                  = var.localstack_enabled ? "test" : null
  secret_key                  = var.localstack_enabled ? "test" : null
  skip_credentials_validation = var.localstack_enabled
  skip_requesting_account_id  = var.localstack_enabled
  skip_metadata_api_check     = var.localstack_enabled
  s3_use_path_style           = var.localstack_enabled

  dynamic "endpoints" {
    for_each = var.localstack_enabled ? [1] : []
    content {
      apigatewayv2   = var.localstack_endpoint
      cloudfront     = var.localstack_endpoint
      cloudwatch     = var.localstack_endpoint
      cloudwatchlogs = var.localstack_endpoint
      dynamodb       = var.localstack_endpoint
      iam            = var.localstack_endpoint
      lambda         = var.localstack_endpoint
      s3             = var.localstack_endpoint
      ses            = var.localstack_endpoint
      ssm            = var.localstack_endpoint
      sts            = var.localstack_endpoint
    }
  }
}

provider "aws" {
  alias  = "ses"
  region = var.ses_region

  access_key                  = var.localstack_enabled ? "test" : null
  secret_key                  = var.localstack_enabled ? "test" : null
  skip_credentials_validation = var.localstack_enabled
  skip_requesting_account_id  = var.localstack_enabled
  skip_metadata_api_check     = var.localstack_enabled
  s3_use_path_style           = var.localstack_enabled

  dynamic "endpoints" {
    for_each = var.localstack_enabled ? [1] : []
    content {
      ses = var.localstack_endpoint
      sts = var.localstack_endpoint
    }
  }
}

provider "aws" {
  alias  = "backend"
  region = local.backend_region

  access_key                  = var.localstack_enabled ? "test" : null
  secret_key                  = var.localstack_enabled ? "test" : null
  skip_credentials_validation = var.localstack_enabled
  skip_requesting_account_id  = var.localstack_enabled
  skip_metadata_api_check     = var.localstack_enabled
  s3_use_path_style           = var.localstack_enabled

  dynamic "endpoints" {
    for_each = var.localstack_enabled ? [1] : []
    content {
      apigatewayv2   = var.localstack_endpoint
      cloudwatch     = var.localstack_endpoint
      cloudwatchlogs = var.localstack_endpoint
      dynamodb       = var.localstack_endpoint
      lambda         = var.localstack_endpoint
      ssm            = var.localstack_endpoint
      sts            = var.localstack_endpoint
    }
  }
}

data "aws_caller_identity" "current" {
  count = var.localstack_enabled ? 0 : 1
}

locals {
  backend_region                  = var.backend_region != "" ? var.backend_region : var.aws_region
  name_prefix                     = "${var.project}-${var.environment}"
  lambda_root                     = "${path.module}/../lambdas"
  mac_artifacts_dir_abs           = var.mac_artifacts_dir != "" ? abspath(var.mac_artifacts_dir) : ""
  windows_artifacts_dir_abs       = var.windows_artifacts_dir != "" ? abspath(var.windows_artifacts_dir) : ""
  mac_artifacts                   = var.mac_artifacts_dir != "" ? fileset(local.mac_artifacts_dir_abs, "**/*") : []
  windows_artifacts               = var.windows_artifacts_dir != "" ? fileset(local.windows_artifacts_dir_abs, "**/*") : []
  aws_account_id                  = var.localstack_enabled ? "*" : data.aws_caller_identity.current[0].account_id
  stripe_secret_key_param         = var.stripe_secret_key_param != "" ? var.stripe_secret_key_param : "/goalsguild/${var.environment}/stripe_secret_key"
  stripe_price_id_param           = var.stripe_price_id_param != "" ? var.stripe_price_id_param : "/goalsguild/${var.environment}/stripe_price_id"
  stripe_webhook_secret_param     = var.stripe_webhook_secret_param != "" ? var.stripe_webhook_secret_param : "/goalsguild/${var.environment}/stripe_webhook_secret"
  stripe_secret_key_param_arn     = "arn:aws:ssm:${local.backend_region}:${local.aws_account_id}:parameter/${trimprefix(local.stripe_secret_key_param, "/")}"
  stripe_price_id_param_arn       = "arn:aws:ssm:${local.backend_region}:${local.aws_account_id}:parameter/${trimprefix(local.stripe_price_id_param, "/")}"
  stripe_webhook_secret_param_arn = "arn:aws:ssm:${local.backend_region}:${local.aws_account_id}:parameter/${trimprefix(local.stripe_webhook_secret_param, "/")}"
  api_origin_domain = var.localstack_enabled ? replace(var.localstack_endpoint, "http://", "") : replace(
    aws_apigatewayv2_api.license.api_endpoint,
    "https://",
    ""
  )

  lambda_handlers = {
    validate             = "validate.handler.handler"
    heartbeat            = "heartbeat.handler.handler"
    provision            = "provision.handler.handler"
    activate_trial       = "activate_trial.handler.handler"
    request_verification = "request_verification.handler.handler"
    verify_email         = "verify_email.handler.handler"
    revoke               = "revoke.handler.handler"
    admin                = "admin.handler.handler"
    stripe_checkout      = "stripe_checkout.handler.handler"
    stripe_webhook       = "stripe_webhook.handler.handler"
    download             = "download.handler.handler"
  }

  common_lambda_env = {
    TABLE_NAME                  = aws_dynamodb_table.licenses.name
    JWT_SECRET                  = var.jwt_secret
    CACHE_VALIDATION_SECRET     = var.cache_validation_secret
    SOURCE_EMAIL                = var.source_email
    SES_REGION                  = var.ses_region
    ALLOW_INSECURE_DEFAULTS     = var.allow_insecure_defaults ? "1" : "0"
    STRIPE_SECRET_KEY_PARAM     = local.stripe_secret_key_param
    STRIPE_PRICE_ID_PARAM       = local.stripe_price_id_param
    STRIPE_WEBHOOK_SECRET_PARAM = local.stripe_webhook_secret_param
    FRONTEND_URL                = var.localstack_enabled ? "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}" : var.frontend_url
    LICENSE_API_URL             = aws_apigatewayv2_api.license.api_endpoint
    ORIGIN_SECRET               = random_password.origin_secret.result
    PROVISION_API_SECRET        = var.jwt_secret # Using jwt_secret as a simple shared secret for internal calls
    ADMIN_API_SECRET            = var.jwt_secret
    TRIAL_DAYS_PARAM            = aws_ssm_parameter.trial_days.name
    RELEASE_BUCKET              = aws_s3_bucket.app_releases.bucket
    RELEASE_BUCKET_REGION       = var.aws_region
    MAC_ARM64_RELEASE_KEY       = "mac/${var.app_version}/GoalsGuild Coach-${var.app_version}-arm64.dmg"
    MAC_X86_64_RELEASE_KEY      = "mac/${var.app_version}/GoalsGuild Coach-${var.app_version}-x86_64.dmg"
    WINDOWS_RELEASE_KEY         = "windows/${var.app_version}/GoalsGuild Coach-${var.app_version}-windows-x86_64.msi"
    DOWNLOAD_URL_EXPIRES        = "900"
  }

  admin_route_arns = [
    "${aws_apigatewayv2_api.license.execution_arn}/*/GET/admin/licenses",
    "${aws_apigatewayv2_api.license.execution_arn}/*/POST/admin/revoke"
  ]
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "random_password" "origin_secret" {
  length  = 32
  special = false
}

resource "aws_ses_email_identity" "source_email" {
  provider = aws.ses
  count    = var.source_email != "" ? 1 : 0
  email    = var.source_email
}

resource "aws_s3_bucket" "prompts" {
  bucket        = "${local.name_prefix}-prompts-${random_id.suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "prompts" {
  bucket = aws_s3_bucket.prompts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "frontend" {
  bucket        = "${local.name_prefix}-frontend-${random_id.suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "404.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_public" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

resource "aws_cloudfront_distribution" "frontend" {
  web_acl_id = !var.localstack_enabled && var.environment == "prod" ? aws_wafv2_web_acl.frontend_prod[0].arn : null

  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3Frontend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = local.api_origin_domain
    origin_id   = "ApiGatewayOrigin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = var.localstack_enabled ? "http-only" : "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "x-origin-secret"
      value = random_password.origin_secret.result
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  aliases             = var.cloudfront_aliases
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Frontend"

    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # AWS managed CachingOptimized
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "ApiGatewayOrigin"

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # AWS managed CachingDisabled
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AWS managed AllViewerExceptHostHeader
    viewer_protocol_policy   = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.cloudfront_acm_certificate_arn == ""
    acm_certificate_arn            = var.cloudfront_acm_certificate_arn != "" ? var.cloudfront_acm_certificate_arn : null
    ssl_support_method             = var.cloudfront_acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = var.cloudfront_acm_certificate_arn != "" ? "TLSv1.2_2021" : "TLSv1"
  }
}

resource "aws_s3_bucket" "app_releases" {
  bucket        = "${local.name_prefix}-releases-${random_id.suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "app_releases" {
  bucket = aws_s3_bucket.app_releases.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "licenses" {
  provider = aws.backend

  name         = "${local.name_prefix}-licenses"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "email"
    type = "S"
  }
  attribute {
    name = "machine_id"
    type = "S"
  }
  attribute {
    name = "stripe_payment_intent"
    type = "S"
  }
  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "email"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2"
    hash_key        = "machine_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI3"
    hash_key        = "stripe_payment_intent"
    range_key       = "SK"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  provider = aws.backend

  name  = "/goalsguild/jwt_secret"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "cache_secret" {
  provider = aws.backend

  name  = "/goalsguild/cached_validation_secret"
  type  = "SecureString"
  value = var.cache_validation_secret
}

resource "aws_ssm_parameter" "trial_days" {
  provider = aws.backend

  name  = "/goalsguild/${var.environment}/trial_days"
  type  = "String"
  value = tostring(var.trial_days)
}

resource "aws_iam_role" "lambda_exec" {
  name = "${local.name_prefix}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "basic_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "app_access" {
  name = "${local.name_prefix}-lambda-access"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.licenses.arn,
          "${aws_dynamodb_table.licenses.arn}/index/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.prompts.arn,
          "${aws_s3_bucket.prompts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = ["s3:GetObject"]
        Resource = [
          "${aws_s3_bucket.app_releases.arn}/mac/${var.app_version}/*",
          "${aws_s3_bucket.app_releases.arn}/windows/${var.app_version}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = [
          aws_ssm_parameter.jwt_secret.arn,
          aws_ssm_parameter.cache_secret.arn,
          aws_ssm_parameter.trial_days.arn,
          local.stripe_secret_key_param_arn,
          local.stripe_price_id_param_arn,
          local.stripe_webhook_secret_param_arn
        ]
      }
    ]
  })
}

data "archive_file" "lambdas_zip" {
  type        = "zip"
  source_dir  = local.lambda_root
  output_path = "${path.module}/.terraform/lambdas.zip"
}

resource "aws_lambda_function" "handlers" {
  provider = aws.backend

  for_each = local.lambda_handlers

  function_name = "${local.name_prefix}-${each.key}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = each.value
  runtime       = "python3.12"
  timeout       = 20
  architectures = [var.localstack_enabled ? "arm64" : "x86_64"]

  filename         = data.archive_file.lambdas_zip.output_path
  source_code_hash = data.archive_file.lambdas_zip.output_base64sha256

  environment {
    variables = merge(local.common_lambda_env, {
      PROMPT_BUCKET = aws_s3_bucket.prompts.bucket
    })
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}

resource "aws_cloudwatch_log_group" "lambda" {
  provider = aws.backend

  for_each = local.lambda_handlers

  name              = "/aws/lambda/${local.name_prefix}-${each.key}"
  retention_in_days = var.lambda_log_retention_days
}

resource "aws_apigatewayv2_api" "license" {
  provider = aws.backend

  name          = "${local.name_prefix}-license-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = var.allowed_origins
    allow_headers = ["content-type", "authorization", "x-license-secret", "x-admin-secret", "stripe-signature"]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  provider = aws.backend

  api_id      = aws_apigatewayv2_api.license.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
  }

  route_settings {
    route_key              = "POST /webhook"
    throttling_burst_limit = var.webhook_throttle_burst_limit
    throttling_rate_limit  = var.webhook_throttle_rate_limit
  }

  route_settings {
    route_key              = "POST /api/webhook"
    throttling_burst_limit = var.webhook_throttle_burst_limit
    throttling_rate_limit  = var.webhook_throttle_rate_limit
  }

  depends_on = [aws_apigatewayv2_route.routes]
}

resource "aws_apigatewayv2_integration" "lambda" {
  provider = aws.backend

  for_each = aws_lambda_function.handlers

  api_id                 = aws_apigatewayv2_api.license.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = each.value.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  provider = aws.backend

  for_each = {
    "POST /validate"                 = "validate"
    "POST /heartbeat"                = "heartbeat"
    "POST /trials"                   = "activate_trial"
    "POST /licenses"                 = "provision"
    "POST /request-verification"     = "request_verification"
    "POST /verify-email"             = "verify_email"
    "POST /admin/revoke"             = "revoke"
    "GET /admin/licenses"            = "admin"
    "POST /checkout"                 = "stripe_checkout"
    "POST /webhook"                  = "stripe_webhook"
    "GET /api/download"              = "download"
    "POST /api/validate"             = "validate"
    "POST /api/heartbeat"            = "heartbeat"
    "POST /api/trials"               = "activate_trial"
    "POST /api/licenses"             = "provision"
    "POST /api/request-verification" = "request_verification"
    "POST /api/verify-email"         = "verify_email"
    "POST /api/admin/revoke"         = "revoke"
    "GET /api/admin/licenses"        = "admin"
    "POST /api/checkout"             = "stripe_checkout"
    "POST /api/webhook"              = "stripe_webhook"
  }

  api_id    = aws_apigatewayv2_api.license.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.value].id}"
  authorization_type = (
    startswith(each.key, "POST /admin/") || startswith(each.key, "GET /admin/") || startswith(each.key, "POST /api/admin/") || startswith(each.key, "GET /api/admin/")
  ) && var.admin_auth_mode == "iam" ? "AWS_IAM" : "NONE"
}

resource "aws_lambda_permission" "allow_apigw" {
  provider = aws.backend

  for_each = aws_lambda_function.handlers

  statement_id  = "AllowExecutionFromApiGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.license.execution_arn}/*/*"
}

resource "aws_iam_policy" "admin_api_invoke" {
  count = var.admin_auth_mode == "iam" ? 1 : 0

  name = "${local.name_prefix}-admin-api-invoke"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["execute-api:Invoke"]
      Resource = local.admin_route_arns
    }]
  })
}

resource "aws_iam_role" "admin_api_invoke" {
  count = var.admin_auth_mode == "iam" && length(var.admin_assume_role_principals) > 0 ? 1 : 0

  name = "${local.name_prefix}-admin-api-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = var.admin_assume_role_principals
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "admin_api_invoke" {
  count = var.admin_auth_mode == "iam" && length(var.admin_assume_role_principals) > 0 ? 1 : 0

  role       = aws_iam_role.admin_api_invoke[0].name
  policy_arn = aws_iam_policy.admin_api_invoke[0].arn
}

resource "aws_wafv2_web_acl" "frontend_prod" {
  count = !var.localstack_enabled && var.environment == "prod" ? 1 : 0

  name  = "${local.name_prefix}-frontend-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-frontend-waf"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-managed-common"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimit"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }
}

resource "aws_s3_object" "mac_artifacts" {
  for_each = {
    for f in local.mac_artifacts : f => f
    if !endswith(f, "/")
  }

  bucket = aws_s3_bucket.app_releases.id
  key    = "mac/${var.app_version}/${each.value}"
  source = "${local.mac_artifacts_dir_abs}/${each.value}"
  etag   = filemd5("${local.mac_artifacts_dir_abs}/${each.value}")
}

resource "aws_s3_object" "windows_artifacts" {
  for_each = {
    for f in local.windows_artifacts : f => f
    if !endswith(f, "/")
  }

  bucket = aws_s3_bucket.app_releases.id
  key    = "windows/${var.app_version}/${each.value}"
  source = "${local.windows_artifacts_dir_abs}/${each.value}"
  etag   = filemd5("${local.windows_artifacts_dir_abs}/${each.value}")
}
