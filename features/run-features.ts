import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { runFolder } from '@nordicsemiconductor/bdd-markdown'
import { stackOutput } from '@nordicsemiconductor/cloudformation-helpers'
import chalk from 'chalk'
import * as path from 'path'
import { STACK_NAME } from '../cdk/stacks/stackConfig.js'
import { steps as restSteps } from './rest-steps.js'
import { store } from './storage.js'
import type { StackOutputs } from '../cdk/stacks/RestEchoStack.js'

/**
 * This file configures the BDD Feature runner
 * by loading the configuration for the test resources
 * (like AWS services) and providing the required
 * step runners and reporters.
 */

const config = await stackOutput(new CloudFormationClient({}))<StackOutputs>(
	STACK_NAME,
)

export type World = {
	domainName: string
} & {
	response?: { body: string; headers: Headers }
}

const print = (arg: unknown) =>
	typeof arg === 'object' ? JSON.stringify(arg) : arg

const runner = await runFolder<World>({
	folder: path.join(process.cwd(), 'features'),
	name: 'REST echo',
	logObserver: {
		onDebug: (info, ...args) =>
			console.error(
				chalk.magenta(info.context.keyword),
				...args.map((arg) => chalk.cyan(print(arg))),
			),
		onError: (info, ...args) =>
			console.error(
				chalk.magenta(info.context.keyword),
				...args.map((arg) => chalk.red(print(arg))),
			),
		onInfo: (info, ...args) =>
			console.error(
				chalk.magenta(info.context.keyword),
				...args.map((arg) => chalk.green(print(arg))),
			),
		onProgress: (info, ...args) =>
			console.error(
				chalk.magenta(info.context.keyword),
				...args.map((arg) => chalk.yellow(print(arg))),
			),
	},
})

runner.addStepRunners(...restSteps()).addStepRunners(store)

const res = await runner.run({
	domainName: config.domainName,
})

console.log(JSON.stringify(res, null, 2))

if (!res.ok) process.exit(1)
