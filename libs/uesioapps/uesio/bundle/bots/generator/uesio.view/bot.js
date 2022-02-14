function view(bot) {
	var name = bot.params.get("name")
	var definition =
		bot.params.get("definition") || bot.getTemplate("blankdefinition.yaml")

	var namespace = bot.getNamespace()
	bot.generateYamlFile(
		"views/" + namespace + "." + name + ".yaml",
		{
			name: name,
			definition: definition,
		},
		"view.yaml"
	)
}
