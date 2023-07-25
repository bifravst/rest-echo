import { parseRequest } from './parseRequest.js'
import { describe, test as it } from 'node:test'
import assert from 'node:assert'

void describe('parseRequest()', () => {
	void it('should parse method, resource, protocol, headers and body', () =>
		assert.deepEqual(
			parseRequest(
				[`Content-Type: text/plain; charset=utf-8`, ``, `Hello!`].join('\n'),
			),
			{
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
				},
				body: 'Hello!',
			},
		))
})
