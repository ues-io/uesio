function view(bot) {
	var name = bot.params.get("name")
	var definition =
		bot.params.get("definition") ||
		bot.getTemplate("templates/blankdefinition.yaml")

	if (bot.checkIfFileExists(name, "views")) {
		log("ERROR")
	}

	bot.generateYamlFile(
		"views/" + name + ".yaml",
		{
			name: name,
			definition: definition,
		},
		"templates/view.yaml"
	)
}
