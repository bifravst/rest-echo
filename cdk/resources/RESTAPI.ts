import {
	aws_apigateway as ApiGateway,
	Duration,
	aws_dynamodb as DynamoDB,
	aws_iam as IAM,
	aws_lambda as Lambda,
	RemovalPolicy,
} from 'aws-cdk-lib'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { readFileSync } from 'node:fs'
import path from 'node:path'

export class RESTAPI extends Construct {
	public readonly api: ApiGateway.RestApi
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
			timeout: Duration.seconds(5),
			memorySize: 512,
			code: Lambda.Code.fromInline(
				readFileSync(path.join(process.cwd(), 'lambda', 'api.js'), 'utf-8'),
			),
			description: 'Handle REST requests',
			environment: {
				TABLE_NAME: storage.tableName,
				NODE_NO_WARNINGS: '1',
			},
			logRetention: RetentionDays.ONE_DAY,
		})
		storage.grantReadWriteData(lambda)

		// This is the API Gateway, AWS CDK automatically creates a prod stage and deployment
		this.api = new ApiGateway.RestApi(this, 'api', {
			restApiName: `REST Echo API`,
			description: 'API to be used as a simple REST demo API',
			binaryMediaTypes: ['application/octet-stream'],
		})
		const proxyResource = this.api.root.addResource('{proxy+}')
		proxyResource.addMethod('ANY', new ApiGateway.LambdaIntegration(lambda))
		// API Gateway needs to be able to call the lambda
		lambda.addPermission('InvokeByApiGateway', {
			principal: new IAM.ServicePrincipal('apigateway.amazonaws.com'),
			sourceArn: this.api.arnForExecuteApi(),
		})
	}
}
