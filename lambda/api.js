/* eslint @typescript-eslint/no-require-imports: 0 */
/* eslint @typescript-eslint/no-var-requires: 0 */
const {
	DynamoDBClient,
	GetItemCommand,
	PutItemCommand,
	DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb')
const { unmarshall } = require('@aws-sdk/util-dynamodb')
const { randomUUID } = require('node:crypto')
const { GetParametersByPathCommand, SSMClient } = require('@aws-sdk/client-ssm')

const db = new DynamoDBClient({})
const TableName = process.env.TABLE_NAME

const cacheHeaders = {
	'Cache-control': 'no-cache, no-store',
}

/**
 * The endpoint URI uses the following format, where the Data Collection
 * Endpoint and DCR Immutable ID identify the DCE and DCR.
 * The immutable ID is generated for the DCR when it's created.
 * You can retrieve it from the JSON view of the DCR in the Azure portal.
 * Stream Name refers to the stream in the DCR that should handle the custom
 * data.
 *
 * @see https://learn.microsoft.com/en-us/azure/azure-monitor/logs/logs-ingestion-api-overview#rest-api-call
 */
const tracker = ({ endpoint, dcrId, streamName, secret, debug }) => {
	const url = new URL(
		`${endpoint.toString().replaceAll(/\/$/g, '')}/dataCollectionRules/${dcrId}/streams/${streamName}?api-version=2023-01-01`,
	)

	debug?.('Tracking to', url.toString())

	return async (
		/**
		 * `https` or `http`
		 */
		protocol,
		/**
		 * The REST method, e.g. `GET`, `POST`, `PUT`, or `DELETE`
		 */
		method,
	) => {
		const ts = new Date()
		const log = [
			{
				TimeGenerated: ts.toISOString(),
				protocol: `REST:${protocol}`,
				action: method,
			},
		]
		debug?.(JSON.stringify(log))
		await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${secret}`,
			},
			body: JSON.stringify(log),
		})
	}
}

const settingsPromise = (async () => {
	const ssm = new SSMClient({})
	const Path = `/${process.env.STACK_NAME ?? 'rest-echo'}/metrics/`
	const { Parameters } = await ssm.send(
		new GetParametersByPathCommand({
			Path,
			WithDecryption: true,
		}),
	)
	return (Parameters ?? []).reduce(
		(acc, { Name, Value }) => ({ ...acc, [Name.replace(Path, '')]: Value }),
		{},
	)
})()

module.exports = {
	handler: async (event) => {
		console.log(JSON.stringify({ event }))

		// Metrics tracking
		let track
		const { endpoint, dcrId, streamName, secret } = await settingsPromise
		if (
			endpoint !== undefined &&
			dcrId !== undefined &&
			streamName !== undefined &&
			secret !== undefined
		) {
			track = tracker({
				endpoint,
				dcrId,
				streamName,
				secret,
				debug: (...args) => console.debug('[Metrics]', ...args),
			})
		} else {
			console.debug(`[Metrics]`, 'disabled')
		}

		const method = event.requestContext.http.method
		const path = event.requestContext.http.path
		const keySegment = path.split('/')[1]
		const key = keySegment.slice(0, 255).replace(/[^0-9a-z_-]/gi, '')

		if (keySegment !== key) {
			return {
				statusCode: 400,
				body: 'Key is invalid.',
			}
		}

		console.log(JSON.stringify({ method, key }))
		await track?.(event.headers['x-forwarded-proto'], method)

		if (method === 'POST' && key === 'new') {
			return {
				statusCode: 201,
				body: randomUUID(),
				headers: {
					'Content-type': 'text/plain; charset=utf-8',
					...cacheHeaders,
				},
			}
		}

		if (method === 'GET') {
			if (key === '') {
				return {
					statusCode: 302,
					headers: {
						location: 'https://github.com/bifravst/rest-echo',
					},
				}
			}
			const { Item } = await db.send(
				new GetItemCommand({
					TableName,
					Key: {
						storageKey: {
							S: key,
						},
					},
				}),
			)
			if (Item === undefined) {
				return {
					statusCode: 404,
				}
			}
			const body = unmarshall(Item).payload
			const base64Encode = event.headers?.['accept-encoding'] === 'base64'
			return {
				statusCode: 200,
				body: base64Encode
					? Buffer.from(body, 'binary').toString('base64')
					: body,
				headers: {
					'Content-type': 'text/plain; charset=utf-8',
					'Content-encoding': base64Encode ? 'base64' : undefined,
					...cacheHeaders,
				},
			}
		} else if (method === 'PUT') {
			const body =
				event.isBase64Encoded === true
					? Buffer.from(event.body, 'base64').toString()
					: event.body
			const payload = body.trim().slice(0, 255)
			await db.send(
				new PutItemCommand({
					TableName,
					Item: {
						storageKey: {
							S: key,
						},
						payload: {
							S: payload,
						},
						ttl: {
							N: (Date.now() / 1000 + 60 * 60).toString(),
						},
					},
				}),
			)
			return {
				statusCode: 202,
			}
		} else if (method === 'DELETE') {
			await db.send(
				new DeleteItemCommand({
					TableName,
					Key: {
						storageKey: {
							S: key,
						},
					},
				}),
			)
			return {
				statusCode: 202,
			}
		}

		return {
			statusCode: 400,
			body: `Invalid action: ${method} ${key}!`,
		}
	},
}
