export const parseRequest = (
	r: string,
): {
	headers: Record<string, string>
	body: string
} => {
	const lines = r.split('\n')
	const blankLineLocation = lines.indexOf('')
	const headerLines =
		blankLineLocation === -1 ? lines : lines.slice(0, blankLineLocation)
	const body =
		blankLineLocation === -1
			? ''
			: lines.slice(blankLineLocation + 1).join('\n')

	return {
		headers: headerLines
			.map((s) => s.split(':', 2))
			.reduce((headers, [k, v]) => ({ ...headers, [k ?? '']: v?.trim() }), {}),
		body,
	}
}
