function run(bot) {
  const description = bot.params.get("description")
  const name = bot.params.get("name")
  const samples = bot.params.get("samples")
  const aspectRatio = bot.params.get("aspect_ratio")
  const namespace = bot.getAppName()

  const prompt = `
		Seamless tile, (minimal:0.9), (artistic:0.5) (wallpaper:1) background
		with a description of:

		${description}

		Simple, small, illustrations.
	`

  bot.runGenerator("uesio/sitekit", "image", {
    name,
    prompt,
    samples,
    aspect_ratio: aspectRatio,
  })

  bot.setRedirect(`/files/${namespace}/${name}`)
}
