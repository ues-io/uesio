function view(bot) {
	var name = bot.params.get("name")
	var namespace = bot.getNamespace()
	bot.generateFile(
		"views/" + namespace + "." + name + ".yaml",
		{
			name: name,
		},
		"view.yaml"
	)
}
