function componentvariant(bot) {
	var name = bot.params.get("name")
	var componentKey = bot.params.get("component")
	const parts = componentKey.split(".")
	bot.generateYamlFile(
		"componentvariants/" + parts[0] + "/" + parts[1] + "/" + name + ".yaml",
		{
			name,
			definition: bot.params.get("definition"),
			label: bot.params.get("label"),
			extends: bot.params.get("extends"),
		},
		"templates/componentvariant.yaml"
	)
}
