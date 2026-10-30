import type { PackedLambda } from '@bifravst/aws-cdk-lambda-helpers'
import { PackedLambdaFn } from '@bifravst/aws-cdk-lambda-helpers/cdk'
import {
	Duration,
	aws_dynamodb as DynamoDB,
	aws_lambda as Lambda,
	RemovalPolicy,
} from 'aws-cdk-lib'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

export class RESTAPI extends Construct {
	public readonly lambdaURL: Lambda.FunctionUrl
	public constructor(parent: Construct, lambdaSource: PackedLambda) {
		super(parent, 'RESTAPI')

		const storage = new DynamoDB.Table(this, 'storage', {
			billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
			partitionKey: {
				name: 'storageKey',
				type: DynamoDB.AttributeType.STRING,
			},
			timeToLiveAttribute: 'ttl',
			removalPolicy: RemovalPolicy.DESTROY,
		})

		const lambda = new PackedLambdaFn(this, 'lambda', lambdaSource, {
			// The Node.js 26 runtime exists in Lambda, but is not yet available in the aws-cdk-lib types
			runtime: new Lambda.Runtime('nodejs26.x', Lambda.RuntimeFamily.NODEJS),
			timeout: Duration.seconds(1),
			memorySize: 512,
			description: 'Handle REST requests',
			environment: {
				TABLE_NAME: storage.tableName,
				VERSION: process.env.VERSION ?? '0.0.0-development',
			},
			logGroup: new LogGroup(this, 'log-group', {
				removalPolicy: RemovalPolicy.DESTROY,
				retention: RetentionDays.ONE_DAY,
			}),
		})
		storage.grantReadWriteData(lambda.fn)
		this.lambdaURL = lambda.fn.addFunctionUrl({
			authType: Lambda.FunctionUrlAuthType.NONE,
		})
	}
}
