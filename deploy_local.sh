#!/bin/bash
set -e

echo "=================================================="
echo "🛠️  Deploying GoalsGuild Coach to LOCALSTACK"
echo "=================================================="

cd infra/terraform
echo "☁️  1. Deploying LocalStack Infrastructure via Terraform..."
terraform init
terraform apply -auto-approve -var-file="environments/local.tfvars"

# Get outputs
LICENSE_API_URL=$(terraform output -raw license_api_url)
FRONTEND_BUCKET=$(terraform output -raw frontend_s3_bucket)
CLOUDFRONT_URL=$(terraform output -raw frontend_cloudfront_url)

echo "📦 2. Building static landing page with Local API URL..."
cd ../../landing
npm install
echo "🧹 Cleaning previous Next.js build artifacts..."
rm -rf .next out
export NEXT_PUBLIC_LICENSE_API_URL="${LICENSE_API_URL}"
export NEXT_PUBLIC_BASE_PATH="/${FRONTEND_BUCKET}"
npm run build

echo "📤 3. Syncing landing page to LocalStack S3..."
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://192.168.68.108:4566 s3 sync out/ s3://$FRONTEND_BUCKET --delete

echo "=================================================="
echo "✅ Local Deployment Complete!"
echo "🌐 Local Landing Page (S3): http://192.168.68.108:4566/$FRONTEND_BUCKET/index.html"
echo "🌐 Local CloudFront (requires host-based routing): $CLOUDFRONT_URL/index.html"
echo "🔌 Local License API:  $LICENSE_API_URL"
echo "=================================================="
