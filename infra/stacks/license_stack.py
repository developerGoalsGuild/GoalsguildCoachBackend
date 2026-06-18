from __future__ import annotations

from pathlib import Path
import os

from aws_cdk import Duration, Stack, aws_apigateway as apigw, aws_dynamodb as ddb, aws_lambda as _lambda
from constructs import Construct


class LicenseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        table = ddb.Table(
            self,
            "Licenses",
            partition_key=ddb.Attribute(name="PK", type=ddb.AttributeType.STRING),
            sort_key=ddb.Attribute(name="SK", type=ddb.AttributeType.STRING),
            billing_mode=ddb.BillingMode.PAY_PER_REQUEST,
        )

        table.add_global_secondary_index(
            index_name="GSI3",
            partition_key=ddb.Attribute(name="stripe_payment_intent", type=ddb.AttributeType.STRING),
            sort_key=ddb.Attribute(name="SK", type=ddb.AttributeType.STRING),
        )
        table.add_global_secondary_index(
            index_name="GSI1",
            partition_key=ddb.Attribute(name="email", type=ddb.AttributeType.STRING),
            sort_key=ddb.Attribute(name="created_at", type=ddb.AttributeType.STRING),
        )
        table.add_global_secondary_index(
            index_name="GSI2",
            partition_key=ddb.Attribute(name="machine_id", type=ddb.AttributeType.STRING),
            sort_key=ddb.Attribute(name="created_at", type=ddb.AttributeType.STRING),
        )

        lambda_root = Path(__file__).resolve().parents[1] / "lambdas"

        def fn(name: str) -> _lambda.Function:
            f = _lambda.Function(
                self,
                f"{name}Fn",
                runtime=_lambda.Runtime.PYTHON_3_12,
                code=_lambda.Code.from_asset(str(lambda_root)),
                handler=f"{name}.handler.handler",
                timeout=Duration.seconds(15),
                environment={
                    "TABLE_NAME": table.table_name,
                    "JWT_SECRET": os.environ.get("JWT_SECRET", "dev-jwt-secret"),
                    "CACHE_VALIDATION_SECRET": os.environ.get("CACHE_VALIDATION_SECRET", "dev-cache-secret"),
                    "SOURCE_EMAIL": os.environ.get("SOURCE_EMAIL", ""),
                    "PROVISION_API_SECRET": os.environ.get("PROVISION_API_SECRET", ""),
                    "ADMIN_API_SECRET": os.environ.get("ADMIN_API_SECRET", ""),
                    "PROMPT_OBJECT_KEY": os.environ.get("PROMPT_OBJECT_KEY", "prompts.enc"),
                    "ALLOW_INSECURE_DEFAULTS": os.environ.get("ALLOW_INSECURE_DEFAULTS", "0"),
                },
            )
            table.grant_read_write_data(f)
            return f

        validate_fn = fn("validate")
        trials_fn = fn("activate_trial")
        licenses_fn = fn("provision")
        heartbeat_fn = fn("heartbeat")
        request_verification_fn = fn("request_verification")
        verify_email_fn = fn("verify_email")
        revoke_fn = fn("revoke")
        admin_fn = fn("admin")

        api = apigw.RestApi(self, "LicenseApi")
        api.root.add_resource("validate").add_method("POST", apigw.LambdaIntegration(validate_fn))
        api.root.add_resource("trials").add_method("POST", apigw.LambdaIntegration(trials_fn))
        api.root.add_resource("licenses").add_method("POST", apigw.LambdaIntegration(licenses_fn))
        api.root.add_resource("heartbeat").add_method("POST", apigw.LambdaIntegration(heartbeat_fn))
        api.root.add_resource("request-verification").add_method("POST", apigw.LambdaIntegration(request_verification_fn))
        api.root.add_resource("verify-email").add_method("POST", apigw.LambdaIntegration(verify_email_fn))
        admin = api.root.add_resource("admin")
        admin.add_resource("revoke").add_method("POST", apigw.LambdaIntegration(revoke_fn))
        admin.add_resource("licenses").add_method("GET", apigw.LambdaIntegration(admin_fn))
