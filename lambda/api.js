const {
	DynamoDBClient,
	GetItemCommand,
	PutItemCommand,
	DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb')
const { unmarshall } = require('@aws-sdk/util-dynamodb')
const { randomUUID } = require('node:crypto')

const db = new DynamoDBClient({})
const TableName = process.env.TABLE_NAME

const cacheHeaders = {
	'Cache-control': 'no-cache, no-store',
}

module.exports = {
	handler: async (event) => {
		console.log(JSON.stringify({ event }))
		const method = event.requestContext.http.method
		const path = event.requestContext.http.path
		const key = path.split('/')[1]

		console.log(JSON.stringify({ method, key }))

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

		switch (method) {
			case 'GET':
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
				return {
					statusCode: 200,
					body: unmarshall(Item).payload,
					headers: {
						'Content-type': 'text/plain; charset=utf-8',
						...cacheHeaders,
					},
				}
			case 'PUT':
				const payload = event.body
					.trim()
					.slice(0, 255)
					.replace(/[^0-9a-z _:!.,;-]/gi, '')
				if (payload !== event.body.trim()) {
					return {
						statusCode: 400,
						body: 'Body is invalid.',
					}
				}
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
			case 'DELETE':
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
