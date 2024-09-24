function image(bot) {
	const modelID = "stability.stable-image-ultra-v1:0"
	const prompt = bot.params.get("prompt")
	const name = bot.params.get("name")
	let samples = bot.params.get("samples") || 1

	if (typeof samples !== "number") {
		throw new Error("Invalid samples parameter")
	}
	if (samples > 4) samples = 4

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
		name: name,
		files: [
			{
				path: name + ".png",
				data: result,
			},
		],
	})
}
