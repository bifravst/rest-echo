import { App } from 'aws-cdk-lib'
import { RestEchoStack } from './stacks/RestEchoStack.js'

export class RestEchoApp extends App {
	public constructor(args: ConstructorParameters<typeof RestEchoStack>[1]) {
		super()

		new RestEchoStack(this, args)
	}
}
