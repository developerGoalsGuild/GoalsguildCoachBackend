# GoalsGuild Coach — Backend & Infrastructure

Repositório separado com a API de licenciamento, infraestrutura AWS e site estático (landing).

Repositório remoto: [developerGoalsGuild/GoalsguildCoachBackend](https://github.com/developerGoalsGuild/GoalsguildCoachBackend.git)

## Estrutura

```
infra/
  lambdas/          # Handlers Lambda (licença, Stripe, trial, download, analytics)
  stacks/           # AWS CDK (legado / referência)
  terraform/        # Infra principal (DynamoDB, API Gateway, S3, CloudFront, SSM)
landing/            # Site Next.js estático (checkout, trial, download, tutoriais)
deploy_local.sh     # Deploy em LocalStack
deploy_prod.sh      # Deploy produção (Terraform + build landing + S3 + CloudFront)
tests/              # Testes unitários dos módulos compartilhados das Lambdas
VERSION             # Versão usada no deploy (upload de instaladores)
```

O app desktop (Python/C#) permanece no repositório do cliente. Coloque os instaladores `.dmg` / `.msi` em `../artifacts/` (ou defina `ARTIFACTS_DIR`) antes do deploy se quiser publicá-los no S3.

## Pré-requisitos

- Terraform, AWS CLI, Node.js/npm, Python 3.11+
- Credenciais AWS configuradas
- Parâmetros Stripe no SSM (ver `infra/terraform/README.md`)

## Deploy produção

```bash
cp infra/terraform/environments/prod.tfvars.example infra/terraform/environments/prod.tfvars
# Edite prod.tfvars com valores reais (não commitar)

./deploy_prod.sh
```

## Deploy local (LocalStack)

```bash
./deploy_local.sh
```

## Testes

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest
```

## Variáveis da landing

Copie `landing/.env.local.example` para `landing/.env.local` em desenvolvimento local.
