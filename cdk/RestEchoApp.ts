import { App } from 'aws-cdk-lib'
import { RestEchoStack } from './stacks/RestEchoStack.js'

export class RestEchoApp extends App {
	public constructor({
		isTest,
		customDomain,
		...args
	}: ConstructorParameters<typeof RestEchoStack>[1] & {
		isTest: boolean
		customDomain?: { domainNames: string[]; certificateId: string }
	}) {
		super({
			context: {
				isTest,
				customDomainNames: customDomain?.domainNames,
				customDomainCertificateId: customDomain?.certificateId,
			},
		})

		new RestEchoStack(this, args)
	}
}
