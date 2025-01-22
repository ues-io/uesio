function run(bot) {
  const organizationName = bot.params.get("organization_name")
  const description = bot.params.get("description")
  const name = bot.params.get("name")
  const samples = bot.params.get("samples")
  const aspectRatio = bot.params.get("aspect_ratio") || "21:9"
  const namespace = bot.getAppName()

  const prompt = `
		A (minimal:0.5), (artistic:0.6), (wordmark:1) for the app
		named (${organizationName}:1). The description of the wordmark is:

		${description}

		The background is white and the workmark
		is full frame, edge-to-edge, borderless, full bleed.`

  bot.runGenerator("uesio/sitekit", "image", {
    name,
    prompt,
    samples,
    aspect_ratio: aspectRatio,
  })

  bot.setRedirect(`/files/${namespace}/${name}`)
}
