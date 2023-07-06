import { App, CfnOutput, Stack } from 'aws-cdk-lib'
import { CloudFront } from '../resources/CloudFront.js'
import { ContinuousDeployment } from '../resources/ContinuousDeployment.js'
import { RESTAPI } from '../resources/RESTAPI.js'
import { STACK_NAME } from './stackConfig.js'

export class RestEchoStack extends Stack {
	public constructor(
		parent: App,
		{
			repository,
			gitHubOICDProviderArn,
		}: {
			repository: {
				owner: string
				repo: string
			}
			gitHubOICDProviderArn: string
		},
	) {
		super(parent, STACK_NAME)

		const api = new RESTAPI(this)
		const cf = new CloudFront(this, api)

		if (this.node.tryGetContext('isTest') !== true) {
			const cd = new ContinuousDeployment(this, {
				repository,
				gitHubOICDProviderArn,
			})

			new CfnOutput(this, 'cdRoleArn', {
				exportName: `${this.stackName}:cdRoleArn`,
				description: 'The role ARN used for continuous deployment',
				value: cd.role.roleArn,
			})
		}

		new CfnOutput(this, 'apiURL', {
			exportName: `${this.stackName}:apiURL`,
			description: 'The API URL',
			value: `https://${cf.distribution.distributionDomainName}`,
		})
	}
}

export type StackOutputs = {
	apiURL: string
	cdRoleArn?: string
}
