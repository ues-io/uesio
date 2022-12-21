function route(bot) {
	var name = bot.params.get("name")
	var path = bot.params.get("path")
	var view = bot.params.get("view")
	var theme = bot.params.get("theme")

	bot.generateFile(
		"routes/" + name + ".yaml",
		{
			name: name,
			path: path,
			view: view,
			theme: theme,
		},
		"templates/route.yaml"
	)
}
