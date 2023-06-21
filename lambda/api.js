module.exports = {
	handler: async (event) => {
		console.log(JSON.stringify({ event }))
		return {
			statusCode: 202,
			body: event.body,
		}
	},
}
