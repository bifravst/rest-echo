# REST echo server

[![GitHub Actions](https://github.com/bifravst/rest-echo/workflows/Test%20and%20Release/badge.svg)](https://github.com/bifravst/rest-echo/actions/workflows/test-and-release.yaml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier/)
[![ESLint: TypeScript](https://img.shields.io/badge/ESLint-TypeScript-blue.svg)](https://github.com/typescript-eslint/typescript-eslint)

A REST echo server used for the
[Nordic Developer Academy](https://academy.nordicsemi.com/) developed using
[AWS CDK](https://aws.amazon.com/cdk) in
[TypeScript](https://www.typescriptlang.org/).

## Installation in your AWS account

### Setup

Provide your AWS credentials, for example using the `.envrc` (see
[the example](.envrc.example)).

Install the dependencies:

```bash
npm ci
```

### Deploy

```bash
npx cdk bootstrap # if this is the first time you use CDK in this account
npx cdk deploy
```

## Usage

Once the API is deployed, you can interact with it:

```bash
# Generate a new random ID
NEW_ID=`http POST https://echo.thingy.rocks/new`
# Store a value
# Allowed characters: /0-9a-z _:!.,;-/, max length 255
http -v PUT https://echo.thingy.rocks/$NEW_ID <<< Hello
# Get the value, also works in the browser
http -v https://echo.thingy.rocks/$NEW_ID
# Delete the value
http -v DELETE https://echo.thingy.rocks/$NEW_ID
```

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
gh variable set DOMAIN_NAME --env production --body "echo.thingy.rocks"
gh variable set CERTIFICATE_ID --env production --body "067dc75e-e8a7-4a28-aaa8-ff26f43f639c"
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
