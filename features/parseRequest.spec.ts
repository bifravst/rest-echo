import assert from 'node:assert'
import { describe, test as it } from 'node:test'
import { parseRequest } from './parseRequest.js'

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
