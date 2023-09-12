import {
	codeBlockOrThrow,
	regExpMatchedStep,
	type StepRunner,
} from '@nordicsemiconductor/bdd-markdown'
import { Type } from '@sinclair/typebox'
import assert from 'assert/strict'
import { type World } from './run-features.js'
import { parseRequest } from './parseRequest.js'

export const steps = (): StepRunner<World>[] => {
	let res: Response | undefined = undefined
	return [
		regExpMatchedStep(
			{
				regExp:
					/^I (?<method>(GET|POST|PUT|DELETE)) (?:to )?`(?<endpoint>https?:\/\/[^/]+)(?<resource>\/[^`]*)`(?<hasBody> with)?$/,
				schema: Type.Object({
					method: Type.Union([
						Type.Literal('GET'),
						Type.Literal('POST'),
						Type.Literal('PUT'),
						Type.Literal('DELETE'),
					]),
					endpoint: Type.RegEx(/^https?:\/\/[^/]+/),
					resource: Type.RegEx(/^\/.*/),
					hasBody: Type.Optional(Type.Literal(' with')),
				}),
			},
			async ({ match, step, log: { progress }, context }) => {
				const url = new URL(match.resource, match.endpoint).toString()
				const method = match.method ?? 'GET'
				progress(`${method} ${url}`)
				let body = undefined
				let headers = undefined
				if (match.hasBody !== undefined) {
					const parsed = parseRequest(codeBlockOrThrow(step).code)
					for (const [k, v] of Object.entries(parsed.headers)) {
						progress(`> ${k}: ${v}`)
					}
					progress(`> ${parsed.body}`)
					body = parsed.body
					headers = parsed.headers
				}

				res = await fetch(url, {
					method,
					body: ['POST', 'PUT'].includes(method) ? body : undefined,
					headers,
					redirect: 'manual',
				})

				progress(`${res.status} ${res.statusText}`)
				let resBody: string | undefined = undefined
				if (parseInt(res.headers.get('content-length') ?? '0', 10) > 0) {
					resBody = await res.text()
					progress(`< ${resBody}`)
				}
				progress(`x-amzn-trace-id: ${res.headers.get('x-amzn-trace-id')}`)
				context.response = { body: resBody ?? '', headers: res.headers }
			},
		),
		regExpMatchedStep(
			{
				regExp: /^the response status code should be `(?<code>[0-9]+)`$/,
				schema: Type.Object({
					code: Type.Integer(),
				}),
				converters: {
					code: (s) => parseInt(s, 10),
				},
			},
			async ({ match }) => {
				assert.equal(res?.status, match.code)
			},
		),
		regExpMatchedStep(
			{
				regExp:
					/^the response `(?<header>[^`]+)` header should equal `(?<expected>[^`]+)`$/,
				schema: Type.Object({
					header: Type.String(),
					expected: Type.String(),
				}),
			},
			async ({ match, context }) => {
				assert.equal(
					context.response?.headers.get(match.header),
					match.expected,
				)
			},
		),
		regExpMatchedStep(
			{
				regExp:
					/^the response body should be a string matching `(?<regexp>[^`]+)`$/,
				schema: Type.Object({
					regexp: Type.String(),
				}),
			},
			async ({ match, context }) => {
				assert.match(
					context.response?.body ?? '',
					new RegExp(match.regexp, 'i'),
				)
			},
		),
		{
			match: (title) => /^the response body should equal$/.test(title),
			run: async ({ step, context }) => {
				assert.equal(context.response?.body ?? '', codeBlockOrThrow(step).code)
			},
		},
	]
}
