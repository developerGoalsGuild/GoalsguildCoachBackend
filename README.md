# GoalsGuild Coach — Backend & Infrastructure

> **Canonical repo:** backend and landing now live in [HRCoach](https://github.com/developerGoalsGuild/HRCoach) (sibling `../HRCoach`). This repository is a mirror; prefer HRCoach for active development.

Repositório com a API de licenciamento, infraestrutura AWS e site estático (landing).

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

O app desktop (Python/C#) permanece no repositório do cliente (`../HRCoach`). Os instaladores `.dmg` / `.msi` são lidos de lá por padrão durante o deploy (`DESKTOP_REPO` / `ARTIFACTS_DIR`).

## Pré-requisitos

- Terraform, AWS CLI, Node.js/npm, Python 3.11+
- Credenciais AWS configuradas
- Parâmetros Stripe no SSM (ver `infra/terraform/README.md`)

## Estado Terraform e tfvars (local)

Os ficheiros `infra/terraform/environments/*.tfvars` e `terraform.tfstate*` **permanecem na máquina** ao lado do código para evitar drift nos deploys, mas **não são enviados ao GitHub** (contêm segredos e o state inclui valores sensíveis).

Após clonar o repo:

```bash
cp infra/terraform/environments/prod.tfvars.example infra/terraform/environments/prod.tfvars
# ou copie prod.tfvars / terraform.tfstate.d/ de um backup ou do repo HRCoach antigo
```

O ficheiro `infra/terraform/.terraform.lock.hcl` está versionado para manter providers consistentes.

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
