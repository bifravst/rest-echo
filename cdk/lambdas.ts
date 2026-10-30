import {
	packLambdaFromPath,
	type PackedLambda,
} from '@bifravst/aws-cdk-lambda-helpers'

export type RestEchoLambdas = {
	api: PackedLambda
}

export const packRestEchoLambdas = async (): Promise<RestEchoLambdas> => ({
	api: await packLambdaFromPath({ id: 'api', sourceFilePath: 'lambda/api.js' }),
})
