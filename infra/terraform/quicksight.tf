locals {
  quicksight_principal_owner_actions = [
    "quicksight:UpdateDashboardPermissions",
    "quicksight:DescribeDashboard",
    "quicksight:DescribeDashboardPermissions",
    "quicksight:UpdateDashboard",
    "quicksight:DeleteDashboard",
    "quicksight:UpdateDashboardPublishedVersion",
    "quicksight:QueryDashboard",
    "quicksight:ListDashboardVersions",
  ]
  quicksight_dataset_owner_actions = [
    "quicksight:DescribeDataSet",
    "quicksight:DescribeDataSetPermissions",
    "quicksight:PassDataSet",
    "quicksight:DescribeIngestion",
    "quicksight:ListIngestions",
    "quicksight:UpdateDataSet",
    "quicksight:DeleteDataSet",
    "quicksight:CreateIngestion",
    "quicksight:CancelIngestion",
    "quicksight:UpdateDataSetPermissions",
  ]
  quicksight_data_source_owner_actions = [
    "quicksight:DescribeDataSource",
    "quicksight:DescribeDataSourcePermissions",
    "quicksight:PassDataSource",
    "quicksight:UpdateDataSource",
    "quicksight:DeleteDataSource",
    "quicksight:UpdateDataSourcePermissions",
  ]

  quicksight_count = (var.quicksight_dashboard_enabled && var.quicksight_principal_arn != "" && !var.localstack_enabled) ? 1 : 0

  dashboard_id = "${local.name_prefix}-licenses-v2"
}

resource "aws_quicksight_data_source" "athena" {
  count = local.quicksight_count

  data_source_id = "${local.name_prefix}-athena"
  name           = "${local.name_prefix} Athena (analytics)"
  type           = "ATHENA"

  parameters {
    athena {
      work_group = aws_athena_workgroup.analytics[0].name
    }
  }

  permission {
    principal = var.quicksight_principal_arn
    actions   = local.quicksight_data_source_owner_actions
  }
}

resource "aws_quicksight_data_set" "licenses" {
  count = local.quicksight_count

  data_set_id = "${local.name_prefix}-licenses"
  name        = "${local.name_prefix} Licenses"
  import_mode = "DIRECT_QUERY"

  physical_table_map {
    physical_table_map_id = "licenses"
    relational_table {
      data_source_arn = aws_quicksight_data_source.athena[0].arn
      catalog         = "AwsDataCatalog"
      schema          = aws_glue_catalog_database.analytics[0].name
      name            = aws_glue_catalog_table.licenses[0].name

      input_columns {
        name = "license_key"
        type = "STRING"
      }
      input_columns {
        name = "license_type"
        type = "STRING"
      }
      input_columns {
        name = "active"
        type = "BOOLEAN"
      }
      input_columns {
        name = "created_at"
        type = "STRING"
      }
      input_columns {
        name = "created_day"
        type = "STRING"
      }
      input_columns {
        name = "created_week"
        type = "STRING"
      }
      input_columns {
        name = "created_month"
        type = "STRING"
      }
      input_columns {
        name = "expires_at"
        type = "STRING"
      }
      input_columns {
        name = "last_heartbeat"
        type = "STRING"
      }
      input_columns {
        name = "machine_id_hash"
        type = "STRING"
      }
      input_columns {
        name = "stripe_session_id"
        type = "STRING"
      }
      input_columns {
        name = "stripe_payment_intent"
        type = "STRING"
      }
      input_columns {
        name = "has_payment"
        type = "BOOLEAN"
      }
      input_columns {
        name = "trial_count"
        type = "INTEGER"
      }
      input_columns {
        name = "email_hash"
        type = "STRING"
      }
      input_columns {
        name = "email_domain"
        type = "STRING"
      }
      input_columns {
        name = "snapshot_date"
        type = "STRING"
      }
    }
  }

  permissions {
    principal = var.quicksight_principal_arn
    actions   = local.quicksight_dataset_owner_actions
  }
}

resource "aws_quicksight_data_set" "downloads" {
  count = local.quicksight_count

  data_set_id = "${local.name_prefix}-downloads"
  name        = "${local.name_prefix} Downloads"
  import_mode = "DIRECT_QUERY"

  physical_table_map {
    physical_table_map_id = "downloads"
    relational_table {
      data_source_arn = aws_quicksight_data_source.athena[0].arn
      catalog         = "AwsDataCatalog"
      schema          = aws_glue_catalog_database.analytics[0].name
      name            = aws_glue_catalog_table.downloads[0].name

      input_columns {
        name = "request_id"
        type = "STRING"
      }
      input_columns {
        name = "created_at"
        type = "STRING"
      }
      input_columns {
        name = "created_day"
        type = "STRING"
      }
      input_columns {
        name = "created_week"
        type = "STRING"
      }
      input_columns {
        name = "created_month"
        type = "STRING"
      }
      input_columns {
        name = "date_bucket"
        type = "STRING"
      }
      input_columns {
        name = "release_key"
        type = "STRING"
      }
      input_columns {
        name = "app_version"
        type = "STRING"
      }
      input_columns {
        name = "platform"
        type = "STRING"
      }
      input_columns {
        name = "user_agent_class"
        type = "STRING"
      }
      input_columns {
        name = "snapshot_date"
        type = "STRING"
      }
    }
  }

  permissions {
    principal = var.quicksight_principal_arn
    actions   = local.quicksight_dataset_owner_actions
  }
}

resource "aws_quicksight_dashboard" "licenses" {
  count = local.quicksight_count

  dashboard_id        = local.dashboard_id
  name                = "${local.name_prefix} Licenses Overview"
  version_description = "v1 - initial licenses + downloads dashboard"

  permissions {
    principal = var.quicksight_principal_arn
    actions   = local.quicksight_principal_owner_actions
  }

  definition {
    data_set_identifiers_declarations {
      data_set_arn = aws_quicksight_data_set.licenses[0].arn
      identifier   = "licenses"
    }
    data_set_identifiers_declarations {
      data_set_arn = aws_quicksight_data_set.downloads[0].arn
      identifier   = "downloads"
    }

    sheets {
      title    = "Overview"
      sheet_id = "overview"

      visuals {
        kpi_visual {
          visual_id = "kpi-total-downloads"
          title {
            format_text {
              plain_text = "Total downloads"
            }
          }
          chart_configuration {
            field_wells {
              values {
                categorical_measure_field {
                  field_id             = "downloads-count"
                  aggregation_function = "COUNT"
                  column {
                    data_set_identifier = "downloads"
                    column_name         = "request_id"
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        kpi_visual {
          visual_id = "kpi-total-licenses"
          title {
            format_text {
              plain_text = "Total licenses"
            }
          }
          chart_configuration {
            field_wells {
              values {
                categorical_measure_field {
                  field_id             = "licenses-count"
                  aggregation_function = "COUNT"
                  column {
                    data_set_identifier = "licenses"
                    column_name         = "license_key"
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        kpi_visual {
          visual_id = "kpi-total-trials"
          title {
            format_text {
              plain_text = "Total trials"
            }
          }
          chart_configuration {
            field_wells {
              values {
                numerical_measure_field {
                  field_id = "trials-total-sum"
                  column {
                    data_set_identifier = "licenses"
                    column_name         = "trial_count"
                  }
                  aggregation_function {
                    simple_numerical_aggregation = "SUM"
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "downloads-by-day"
          title {
            format_text {
              plain_text = "Downloads daily"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "downloads-day"
                    column {
                      data_set_identifier = "downloads"
                      column_name         = "created_day"
                    }
                  }
                }
                values {
                  categorical_measure_field {
                    field_id             = "downloads-day-count"
                    aggregation_function = "COUNT"
                    column {
                      data_set_identifier = "downloads"
                      column_name         = "request_id"
                    }
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "downloads-by-week"
          title {
            format_text {
              plain_text = "Downloads weekly"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "downloads-week"
                    column {
                      data_set_identifier = "downloads"
                      column_name         = "created_week"
                    }
                  }
                }
                values {
                  categorical_measure_field {
                    field_id             = "downloads-week-count"
                    aggregation_function = "COUNT"
                    column {
                      data_set_identifier = "downloads"
                      column_name         = "request_id"
                    }
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "downloads-by-month"
          title {
            format_text {
              plain_text = "Downloads monthly"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "downloads-month"
                    column {
                      data_set_identifier = "downloads"
                      column_name         = "created_month"
                    }
                  }
                }
                values {
                  categorical_measure_field {
                    field_id             = "downloads-month-count"
                    aggregation_function = "COUNT"
                    column {
                      data_set_identifier = "downloads"
                      column_name         = "request_id"
                    }
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "licenses-by-day"
          title {
            format_text {
              plain_text = "Licenses daily"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "licenses-day"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "created_day"
                    }
                  }
                }
                values {
                  categorical_measure_field {
                    field_id             = "licenses-day-count"
                    aggregation_function = "COUNT"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "license_key"
                    }
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "licenses-by-week"
          title {
            format_text {
              plain_text = "Licenses weekly"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "licenses-week"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "created_week"
                    }
                  }
                }
                values {
                  categorical_measure_field {
                    field_id             = "licenses-week-count"
                    aggregation_function = "COUNT"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "license_key"
                    }
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "licenses-by-month"
          title {
            format_text {
              plain_text = "Licenses monthly"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "licenses-month"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "created_month"
                    }
                  }
                }
                values {
                  categorical_measure_field {
                    field_id             = "licenses-month-count"
                    aggregation_function = "COUNT"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "license_key"
                    }
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "trials-by-day"
          title {
            format_text {
              plain_text = "Trials daily"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "trials-day"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "created_day"
                    }
                  }
                }
                values {
                  numerical_measure_field {
                    field_id = "trials-day-sum"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "trial_count"
                    }
                    aggregation_function {
                      simple_numerical_aggregation = "SUM"
                    }
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "trials-by-week"
          title {
            format_text {
              plain_text = "Trials weekly"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "trials-week"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "created_week"
                    }
                  }
                }
                values {
                  numerical_measure_field {
                    field_id = "trials-week-sum"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "trial_count"
                    }
                    aggregation_function {
                      simple_numerical_aggregation = "SUM"
                    }
                  }
                }
              }
            }
          }
        }
      }

      visuals {
        bar_chart_visual {
          visual_id = "trials-by-month"
          title {
            format_text {
              plain_text = "Trials monthly"
            }
          }
          chart_configuration {
            field_wells {
              bar_chart_aggregated_field_wells {
                category {
                  categorical_dimension_field {
                    field_id = "trials-month"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "created_month"
                    }
                  }
                }
                values {
                  numerical_measure_field {
                    field_id = "trials-month-sum"
                    column {
                      data_set_identifier = "licenses"
                      column_name         = "trial_count"
                    }
                    aggregation_function {
                      simple_numerical_aggregation = "SUM"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
