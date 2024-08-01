import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm'

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
const tracker = ({
	endpoint,
	dcrId,
	streamName,
	secret,
}: {
	endpoint: URL
	dcrId: string
	streamName: string
	secret: string
}) => {
	const url = new URL(
		`${endpoint.toString().replaceAll(/\/$/, '')}/dataCollectionRules/${dcrId}/streams/${streamName}?api-version=2023-01-01`,
	)

	return async (
		/**
		 * `https` or `http`
		 */
		protocol: string,
		/**
		 * The REST method, e.g. `GET`, `POST`, `PUT`, or `DELETE`
		 */
		method: string,
	) => {
		const ts = new Date()
		await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${secret}`,
			},
			body: JSON.stringify([
				{
					TimeGenerated: ts.toISOString(),
					Column01: ts.toISOString(),
					Column02: `REST:${protocol}`,
					Column03: method,
				},
			]),
		})
	}
}

const settingsPromise: Promise<{
	endpoint?: URL
	dcrId?: string
	streamName?: string
	secret?: string
}> = (async () => {
	const ssm = new SSMClient({})
	const Path = `/${process.env.STACK_NAME ?? 'rest-echo'}/metrics/`
	const { Parameters } = await ssm.send(
		new GetParametersByPathCommand({
			Path,
			WithDecryption: true,
		}),
	)
	return (Parameters ?? []).reduce(
		(acc, { Name, Value }) => ({ ...acc, [Name!.replace(Path, '')]: Value }),
		{} as {
			endpoint?: URL
			dcrId?: string
			streamName?: string
			secret?: string
		},
	)
})()

let track: ReturnType<typeof tracker> | undefined
const { endpoint, dcrId, streamName, secret } = await settingsPromise
if (
	endpoint !== undefined &&
	dcrId !== undefined &&
	streamName !== undefined &&
	secret !== undefined
) {
	track = tracker({ endpoint, dcrId, streamName, secret })
} else {
	console.debug(`[Metrics]`, 'disabled')
}

await track?.('https', 'GET')
