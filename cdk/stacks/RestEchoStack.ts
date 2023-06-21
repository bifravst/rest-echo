import { App, CfnOutput, Stack } from 'aws-cdk-lib'
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

		new ContinuousDeployment(this, {
			repository,
			gitHubOICDProviderArn,
		})

		new CfnOutput(this, 'apiURL', {
			exportName: `${this.stackName}:apiURL`,
			description: 'The API URL',
			value: api.api.url,
		})
	}
}

export type StackOutputs = {
	apiURL: string
}
