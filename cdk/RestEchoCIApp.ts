import { App } from 'aws-cdk-lib'
import { RestEchoCIStack } from './stacks/RestEchoCIStack.js'
import type { RestEchoStack } from './stacks/RestEchoStack.js'

export class RestEchoCIApp extends App {
	public constructor(args: ConstructorParameters<typeof RestEchoStack>[1]) {
		super()

		new RestEchoCIStack(this, args)
	}
}
