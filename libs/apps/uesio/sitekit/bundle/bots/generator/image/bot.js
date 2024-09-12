function image(bot) {
	const modelID = "stability.stable-image-ultra-v1:0"
	const prompt = bot.params.get("prompt")
	const filename = bot.params.get("filename")
	const aspect_ratio = bot.params.get("aspect_ratio")
	const result = bot.runIntegrationAction(
		"uesio/aikit.bedrock",
		"invokemodel",
		{
			model: modelID,
			input: prompt,
			aspect_ratio,
		}
	)

	bot.runGenerator("uesio/core", "file", {
		name: filename,
		path: filename + ".png",
		data: result,
	})
}
