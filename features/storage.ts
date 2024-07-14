import { regExpMatchedStep } from '@bifravst/bdd-markdown'
import { Type } from '@sinclair/typebox'
import jsonata from 'jsonata'
import assert from 'node:assert/strict'

export const store = regExpMatchedStep(
	{
		regExp: /^I store `(?<exp>[^`]+)` into `(?<storeName>[^`]+)`$/,
		schema: Type.Object({
			exp: Type.String(),
			storeName: Type.String(),
		}),
	},
	async ({ match, log: { progress }, context }) => {
		const e = jsonata(match.exp)
		const result = await e.evaluate(context)
		progress(`Store ${result} -> ${match.storeName}`)
		assert.notEqual(result, undefined)

		context[match.storeName] = result
	},
)
