function route(bot) {
	var name = bot.params.get("name")
	var namespace = bot.getNamespace()
	var path = bot.params.get("path")
	var view = bot.params.get("view")
	var theme = bot.params.get("theme")

	bot.generateFile(
		"routes/" + namespace + "." + name + ".yaml",
		{
			name: name,
			path: path,
			view: view,
			theme: theme,
		},
		"route.yaml"
	)
}
