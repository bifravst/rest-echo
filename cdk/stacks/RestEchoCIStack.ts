import type { App } from 'aws-cdk-lib'
import { CfnOutput, Stack } from 'aws-cdk-lib'
import { ContinuousIntegration } from '../resources/ContinuousIntegration.js'
import { STACK_NAME } from './stackConfig.js'

export class RestEchoCIStack extends Stack {
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
		super(parent, `${STACK_NAME}-ci`)

		const ci = new ContinuousIntegration(this, {
			repository,
			gitHubOICDProviderArn,
		})

		new CfnOutput(this, 'roleArn', {
			exportName: `${this.stackName}:roleArn`,
			description: 'The role ARN',
			value: ci.role.roleArn,
		})
	}
}
