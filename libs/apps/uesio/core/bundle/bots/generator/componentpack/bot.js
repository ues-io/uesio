function collection(bot) {
	var name = bot.params.get("name")
	var components = bot.params.get("components")
	var viewComponentsYaml = bot.repeatString(components, "${key}: null\n")
	bot.generateYamlFile(
		"componentpacks/" + name + "/pack.yaml",
		{
			viewcomponents: viewComponentsYaml,
		},
		"templates/pack.yaml"
	)
}
