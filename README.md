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
