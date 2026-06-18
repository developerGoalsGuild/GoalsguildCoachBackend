locals {
  analytics_enabled        = var.quicksight_dashboard_enabled
  analytics_count          = var.quicksight_dashboard_enabled ? 1 : 0
  analytics_name_prefix    = "${local.name_prefix}-analytics"
  analytics_s3_results     = "athena-results/"
  analytics_licenses_path  = "licenses/"
  analytics_downloads_path = "downloads/"
}

resource "aws_s3_bucket" "analytics" {
  count = local.analytics_count

  bucket        = "${local.analytics_name_prefix}-${random_id.suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "analytics" {
  count = local.analytics_count

  bucket                  = aws_s3_bucket.analytics[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "analytics" {
  count = local.analytics_count

  bucket = aws_s3_bucket.analytics[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "analytics" {
  count = local.analytics_count

  bucket = aws_s3_bucket.analytics[0].id

  rule {
    id     = "expire-athena-results"
    status = "Enabled"

    filter {
      prefix = local.analytics_s3_results
    }

    expiration {
      days = 30
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}


resource "aws_iam_role" "analytics_export" {
  count = local.analytics_count

  name = "${local.analytics_name_prefix}-export"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "analytics_export_logs" {
  count = local.analytics_count

  role       = aws_iam_role.analytics_export[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "analytics_export" {
  count = local.analytics_count

  name = "${local.analytics_name_prefix}-export-access"
  role = aws_iam_role.analytics_export[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:GetItem"
        ]
        Resource = [
          aws_dynamodb_table.licenses.arn,
          "${aws_dynamodb_table.licenses.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:AbortMultipartUpload",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.analytics[0].arn,
          "${aws_s3_bucket.analytics[0].arn}/*"
        ]
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "analytics_export" {
  count    = local.analytics_count
  provider = aws.backend

  name              = "/aws/lambda/${local.analytics_name_prefix}-export"
  retention_in_days = var.lambda_log_retention_days
}

resource "aws_lambda_function" "analytics_export" {
  count    = local.analytics_count
  provider = aws.backend

  function_name = "${local.analytics_name_prefix}-export"
  role          = aws_iam_role.analytics_export[0].arn
  handler       = "analytics_export.handler.handler"
  runtime       = "python3.12"
  timeout       = 300
  memory_size   = 512
  architectures = [var.localstack_enabled ? "arm64" : "x86_64"]

  filename         = data.archive_file.lambdas_zip.output_path
  source_code_hash = data.archive_file.lambdas_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME                 = aws_dynamodb_table.licenses.name
      ANALYTICS_BUCKET           = aws_s3_bucket.analytics[0].bucket
      ANALYTICS_LICENSES_PREFIX  = trim(local.analytics_licenses_path, "/")
      ANALYTICS_DOWNLOADS_PREFIX = trim(local.analytics_downloads_path, "/")
      ANALYTICS_INCLUDE_EMAIL    = var.analytics_include_email ? "1" : "0"
      ANALYTICS_LOOKBACK_DAYS    = tostring(var.analytics_export_lookback_days)
      ANALYTICS_EMAIL_SALT       = random_password.origin_secret.result
    }
  }

  depends_on = [aws_cloudwatch_log_group.analytics_export]
}

resource "aws_cloudwatch_event_rule" "analytics_export" {
  count = local.analytics_count

  name                = "${local.analytics_name_prefix}-schedule"
  description         = "Periodic analytics export from licenses table to S3."
  schedule_expression = var.analytics_export_schedule
}

resource "aws_cloudwatch_event_target" "analytics_export" {
  count = local.analytics_count

  rule      = aws_cloudwatch_event_rule.analytics_export[0].name
  target_id = "analytics-export"
  arn       = aws_lambda_function.analytics_export[0].arn
}

resource "aws_lambda_permission" "analytics_export_eventbridge" {
  count    = local.analytics_count
  provider = aws.backend

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analytics_export[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.analytics_export[0].arn
}

resource "aws_glue_catalog_database" "analytics" {
  count = local.analytics_count

  name        = replace("${local.analytics_name_prefix}", "-", "_")
  description = "Glue database backing the QuickSight licenses dashboard."
}

resource "aws_glue_catalog_table" "licenses" {
  count = local.analytics_count

  name          = "licenses"
  database_name = aws_glue_catalog_database.analytics[0].name
  description   = "Snapshot of license records exported from DynamoDB."
  table_type    = "EXTERNAL_TABLE"

  parameters = {
    classification           = "json"
    "skip.header.line.count" = "0"
    "compressionType"        = "none"
    "typeOfData"             = "file"
  }

  partition_keys {
    name = "snapshot_date"
    type = "string"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.analytics[0].bucket}/${trim(local.analytics_licenses_path, "/")}/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      name                  = "json"
      serialization_library = "org.openx.data.jsonserde.JsonSerDe"
      parameters = {
        "serialization.format"  = "1"
        "ignore.malformed.json" = "true"
      }
    }

    columns {
      name = "license_key"
      type = "string"
    }
    columns {
      name = "license_type"
      type = "string"
    }
    columns {
      name = "active"
      type = "boolean"
    }
    columns {
      name = "created_at"
      type = "string"
    }
    columns {
      name = "created_day"
      type = "string"
    }
    columns {
      name = "created_week"
      type = "string"
    }
    columns {
      name = "created_month"
      type = "string"
    }
    columns {
      name = "expires_at"
      type = "string"
    }
    columns {
      name = "last_heartbeat"
      type = "string"
    }
    columns {
      name = "machine_id_hash"
      type = "string"
    }
    columns {
      name = "stripe_session_id"
      type = "string"
    }
    columns {
      name = "stripe_payment_intent"
      type = "string"
    }
    columns {
      name = "has_payment"
      type = "boolean"
    }
    columns {
      name = "trial_count"
      type = "int"
    }
    columns {
      name = "email_hash"
      type = "string"
    }
    columns {
      name = "email_domain"
      type = "string"
    }
    columns {
      name = "email"
      type = "string"
    }
  }
}

resource "aws_glue_catalog_table" "downloads" {
  count = local.analytics_count

  name          = "downloads"
  database_name = aws_glue_catalog_database.analytics[0].name
  description   = "Download events recorded by the download Lambda."
  table_type    = "EXTERNAL_TABLE"

  parameters = {
    classification    = "json"
    "compressionType" = "none"
    "typeOfData"      = "file"
  }

  partition_keys {
    name = "snapshot_date"
    type = "string"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.analytics[0].bucket}/${trim(local.analytics_downloads_path, "/")}/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      name                  = "json"
      serialization_library = "org.openx.data.jsonserde.JsonSerDe"
      parameters = {
        "serialization.format"  = "1"
        "ignore.malformed.json" = "true"
      }
    }

    columns {
      name = "request_id"
      type = "string"
    }
    columns {
      name = "created_at"
      type = "string"
    }
    columns {
      name = "created_day"
      type = "string"
    }
    columns {
      name = "created_week"
      type = "string"
    }
    columns {
      name = "created_month"
      type = "string"
    }
    columns {
      name = "date_bucket"
      type = "string"
    }
    columns {
      name = "release_key"
      type = "string"
    }
    columns {
      name = "app_version"
      type = "string"
    }
    columns {
      name = "platform"
      type = "string"
    }
    columns {
      name = "user_agent_class"
      type = "string"
    }
  }
}

resource "aws_athena_workgroup" "analytics" {
  count = local.analytics_count

  name        = local.analytics_name_prefix
  description = "Workgroup used by QuickSight to query the licenses analytics database."
  state       = "ENABLED"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.analytics[0].bucket}/${local.analytics_s3_results}"
    }
  }

  force_destroy = true
}
