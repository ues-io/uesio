function view_settings(bot) {
	const namespace = bot.getAppName()
	var definition = bot.mergeYamlTemplate(
		{
			namespace,
		},
		"templates/settings.yaml"
	)
	bot.runGenerator("uesio/core", "view", {
		name: "settings",
		definition,
	})
	bot.runGenerator("uesio/core", "route", {
		name: "settings",
		path: "settings",
		view: "settings",
		theme: "uesio/core.default",
		title: "Settings",
	})
}
