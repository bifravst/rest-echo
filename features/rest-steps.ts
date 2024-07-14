import {
	codeBlockOrThrow,
	regExpMatchedStep,
	type Logger,
	type StepRunner,
} from '@bifravst/bdd-markdown'
import { Type } from '@sinclair/typebox'
import assert from 'assert/strict'
import { type World } from './run-features.js'
import { parseRequest } from './parseRequest.js'

const request = ({
	context,
	url,
	method,
	headers,
	body,
	log: { progress },
}: {
	context: Record<string, any>
	log: Logger
	url: URL
	method: 'POST' | 'PUT' | 'GET' | 'DELETE'
	headers?: Record<string, string>
	body?: string
}) => {
	let statusCode: number | undefined = undefined
	let response: Response | undefined = undefined
	return {
		send: async () => {
			response = await fetch(url.toString(), {
				method,
				body: ['POST', 'PUT'].includes(method) ? body : undefined,
				headers,
				redirect: 'manual',
			})
			statusCode = response.status
			progress(`${response.status} ${response.statusText}`)
			let resBody: string | undefined = undefined
			if (parseInt(response.headers.get('content-length') ?? '0', 10) > 0) {
				resBody = await response.text()
				progress(`< ${resBody}`)
			}
			progress(`x-amzn-trace-id: ${response.headers.get('x-amzn-trace-id')}`)
			context.response = { body: resBody ?? '', headers: response.headers }
			return response
		},
		statusCode: () => statusCode,
		response: () => response,
	}
}

export const steps = (): StepRunner<World>[] => {
	let req: ReturnType<typeof request> | undefined
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
					endpoint: Type.RegExp(/^https?:\/\/[^/]+/),
					resource: Type.RegExp(/^\/.*/),
					hasBody: Type.Optional(Type.Literal(' with')),
				}),
			},
			async ({ match, step, log, context }) => {
				const url = new URL(match.resource, match.endpoint)
				const method = match.method ?? 'GET'
				log.progress(`${method} ${url.toString()}`)
				let body: string | undefined = undefined
				let headers: Record<string, string> | undefined = undefined
				if (match.hasBody !== undefined) {
					const parsed = parseRequest(codeBlockOrThrow(step).code)
					for (const [k, v] of Object.entries(parsed.headers)) {
						log.progress(`> ${k}: ${v}`)
					}
					log.progress(`> ${parsed.body}`)
					body = parsed.body
					headers = parsed.headers
				}
				req = request({
					url,
					method,
					body: ['POST', 'PUT'].includes(method) ? body : undefined,
					headers,
					context,
					log,
				})
				await req.send()
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
			async ({ match, log }) => {
				let numTry = 0
				do {
					try {
						assert.equal(req?.statusCode(), match.code)
						return
					} catch (err) {
						if (numTry < 5) {
							await new Promise((resolve) => setTimeout(resolve, 1000))
							log.progress(`Retrying ...`)
							await req?.send()
							continue
						}
						throw err
					}
				} while (numTry++ < 5)
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
			// eslint-disable-next-line @typescript-eslint/require-await
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
			// eslint-disable-next-line @typescript-eslint/require-await
			async ({ match, context }) => {
				assert.match(
					context.response?.body ?? '',
					new RegExp(match.regexp, 'i'),
				)
			},
		),
		{
			match: (title) => /^the response body should equal$/.test(title),
			// eslint-disable-next-line @typescript-eslint/require-await
			run: async ({ step, context }) => {
				assert.equal(context.response?.body ?? '', codeBlockOrThrow(step).code)
			},
		},
	]
}
