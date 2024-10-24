# REST echo server

[![GitHub Actions](https://github.com/bifravst/rest-echo/workflows/Test%20and%20Release/badge.svg)](https://github.com/bifravst/rest-echo/actions/workflows/test-and-release.yaml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![@commitlint/config-conventional](https://img.shields.io/badge/%40commitlint-config--conventional-brightgreen)](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier/)
[![ESLint: TypeScript](https://img.shields.io/badge/ESLint-TypeScript-blue.svg)](https://github.com/typescript-eslint/typescript-eslint)

A REST echo server used for the
[Nordic Developer Academy](https://academy.nordicsemi.com/) developed using
[AWS CDK](https://aws.amazon.com/cdk) in
[TypeScript](https://www.typescriptlang.org/).

## Installation in your AWS account

### Setup

[Provide your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html).

Install the dependencies:

```bash
npm ci
```

### Configure Metrics (optional)

Configure the metrics for Azure Monitor logs ingestion (used for usage metrics
tracking):

```bash
aws ssm put-parameter --name /${STACK_NAME:-rest-echo}/metrics/endpoint --type String --value "<endpoint>"
aws ssm put-parameter --name /${STACK_NAME:-rest-echo}/metrics/dcrId --type String --value "<dcrId>"
aws ssm put-parameter --name /${STACK_NAME:-rest-echo}/metrics/streamName --type String --value "<streamName>"
aws ssm put-parameter --name /${STACK_NAME:-rest-echo}/metrics/secret --type SecureString --value "<secret>"
```

### Deploy

```bash
npx cdk bootstrap # if this is the first time you use CDK in this account
npx cdk deploy
```

## Usage

Once the API is deployed, you can interact with it as
[documented here](./features/REST-echo-API.feature.md).

Both non-secure HTTP and secure HTTPs are supported.

## Continuous Deployment with GitHub Actions

Create a GitHub environment `production`.

Store the role used for continuous deployment as a secret:

```bash
CD_ROLE_ARN=`aws cloudformation describe-stacks --stack-name ${STACK_NAME:-rest-echo} | jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "cdRoleArn") | .OutputValue'`
gh secret set AWS_ROLE --env production --body "${CD_ROLE_ARN}"
```

Store the stack name and the region as a variable:

```bash
gh variable set STACK_NAME --env production --body "${STACK_NAME:-rest-echo}"
gh variable set AWS_REGION --env production --body "${AWS_REGION}"
```

Optionally, if you are using a custom domain name, store the domain name and the
AWS certificate ID:

```bash
gh variable set DOMAIN_NAMES --env production --body "rest.nordicsemi.academy,echo.thingy.rocks"
gh variable set CERTIFICATE_ID --env production --body "ff6dc724-ac8d-4328-8f86-628126771d67"
```

## CI

To set up continuous integration, prepare **a separate** AWS account and run the
following command to create the necessary resources for GitHub Actions:

```bash
npx cdk -a 'npx tsx --no-warnings cdk/rest-echo-ci.ts' deploy
```

Create a GitHub environment `ci`.

Store the role used for continuous integration as a secret:

```bash
CI_ROLE_ARN=`aws cloudformation describe-stacks --stack-name ${STACK_NAME:-rest-echo}-ci | jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "roleArn") | .OutputValue'`
gh secret set AWS_ROLE --env ci --body "${CI_ROLE_ARN}"
```

Store the stack name and the region as a variable:

```bash
gh variable set STACK_NAME --env ci --body "${STACK_NAME:-rest-echo}"
gh variable set AWS_REGION --env ci --body "${AWS_REGION}"
```
