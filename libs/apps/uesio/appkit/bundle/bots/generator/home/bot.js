function home(bot) {
	const namespace = bot.getAppName()
	var definition = bot.mergeYamlTemplate(
		{
			namespace,
		},
		"templates/home.yaml"
	)
	bot.runGenerator("uesio/core", "view", {
		name: "home",
		definition,
	})
}
