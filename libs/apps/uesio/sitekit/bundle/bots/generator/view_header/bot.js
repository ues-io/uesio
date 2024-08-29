function view_header(bot) {
	const namespace = bot.getAppName()
	var definition = bot.mergeYamlTemplate(
		{
			namespace,
		},
		"templates/header.yaml"
	)
	bot.runGenerator("uesio/core", "view", {
		name: "header",
		definition,
	})
}
