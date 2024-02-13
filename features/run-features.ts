import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { runFolder } from '@nordicsemiconductor/bdd-markdown'
import { stackOutput } from '@nordicsemiconductor/cloudformation-helpers'
import chalk from 'chalk'
import * as path from 'path'
import { STACK_NAME } from '../cdk/stacks/stackConfig.js'
import { steps as restSteps } from './rest-steps.js'
import { store } from './storage.js'
import type { StackOutputs } from '../cdk/stacks/RestEchoStack.js'

const domainName = (
	process.env.DOMAIN_NAMES ??
	(await stackOutput(new CloudFormationClient({}))<StackOutputs>(STACK_NAME))
		.domainNames
).split(',')[0] as string

export type World = {
	domainName: string
} & {
	response?: { body: string; headers: Headers }
}

const print = (arg: unknown) =>
	typeof arg === 'object' ? JSON.stringify(arg) : arg
const start = Date.now()
const ts = () => {
	const diff = Date.now() - start
	return chalk.gray(`[${(diff / 1000).toFixed(3).padStart(8, ' ')}]`)
}

const runner = await runFolder<World>({
	folder: path.join(process.cwd(), 'features'),
	name: 'REST echo',
	logObserver: {
		onDebug: (info, ...args) =>
			console.error(
				ts(),
				chalk.magenta.dim(info.step.keyword),
				chalk.magenta(info.step.title),
				...args.map((arg) => chalk.cyan(print(arg))),
			),
		onError: (info, ...args) =>
			console.error(
				ts(),
				chalk.magenta.dim(info.step.keyword),
				chalk.magenta(info.step.title),
				...args.map((arg) => chalk.red(print(arg))),
			),
		onInfo: (info, ...args) =>
			console.error(
				ts(),
				chalk.magenta.dim(info.step.keyword),
				chalk.magenta(info.step.title),
				...args.map((arg) => chalk.green(print(arg))),
			),
		onProgress: (info, ...args) =>
			console.error(
				ts(),
				chalk.magenta.dim(info.step.keyword),
				chalk.magenta(info.step.title),
				...args.map((arg) => chalk.yellow(print(arg))),
			),
	},
})

runner.addStepRunners(...restSteps()).addStepRunners(store)

const res = await runner.run({
	domainName,
})

console.error(`Writing to stdout ...`)
process.stdout.write(JSON.stringify(res, null, 2), () => {
	console.error(`Done`, res.ok ? chalk.green('OK') : chalk.red('ERROR'))
})
