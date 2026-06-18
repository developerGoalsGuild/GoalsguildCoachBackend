#!/usr/bin/env python3
import aws_cdk as cdk

from stacks.license_stack import LicenseStack

app = cdk.App()
LicenseStack(app, "GoalsGuildLicenseStack")
app.synth()
