function view_footer(bot) {
	const namespace = bot.getAppName()
	var definition = bot.mergeYamlTemplate(
		{
			namespace,
		},
		"templates/footer.yaml"
	)
	bot.runGenerator("uesio/core", "view", {
		name: "footer",
		definition,
	})
}
