function image_logo(bot) {
	const organization_name = bot.params.get("organization_name")
	const description = bot.params.get("description")
	const name = bot.params.get("name")
	const samples = bot.params.get("samples")
	const aspect_ratio = bot.params.get("aspect_ratio") || "21:9"

	const prompt = `
		A (minimal:0.5), (artistic:0.6), (wordmark:1) for the app
		named (${organization_name}:1). The description of the wordmark is:

		${description}

		The background is white and the workmark
		is full frame, edge-to-edge, borderless, full bleed.`

	bot.runGenerator("uesio/sitekit", "image", {
		name,
		prompt,
		samples,
		aspect_ratio,
	})
}
