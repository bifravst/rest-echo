import {
	Duration,
	aws_dynamodb as DynamoDB,
	aws_lambda as Lambda,
	RemovalPolicy,
	Stack,
	aws_iam as IAM,
} from 'aws-cdk-lib'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { readFileSync } from 'node:fs'
import path from 'node:path'

export class RESTAPI extends Construct {
	public readonly lambdaURL: Lambda.FunctionUrl
	public constructor(parent: Construct) {
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

		const lambda = new Lambda.Function(this, 'lambda', {
			handler: 'index.handler',
			architecture: Lambda.Architecture.ARM_64,
			runtime: Lambda.Runtime.NODEJS_18_X,
			timeout: Duration.seconds(1),
			memorySize: 512,
			code: Lambda.Code.fromInline(
				readFileSync(path.join(process.cwd(), 'lambda', 'api.js'), 'utf-8'),
			),
			description: 'Handle REST requests',
			environment: {
				TABLE_NAME: storage.tableName,
				NODE_NO_WARNINGS: '1',
				STACK_NAME: Stack.of(this).stackName,
			},
			logRetention: RetentionDays.ONE_DAY,
			initialPolicy: [
				new IAM.PolicyStatement({
					actions: ['ssm:GetParametersByPath'],
					resources: [
						`arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/${Stack.of(this).stackName}/*`,
					],
				}),
			],
		})
		storage.grantReadWriteData(lambda)
		this.lambdaURL = lambda.addFunctionUrl({
			authType: Lambda.FunctionUrlAuthType.NONE,
		})
	}
}
