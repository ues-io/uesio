function collection(bot) {
	var name = bot.params.get("name")
	var namespace = bot.getNamespace()
	var components = bot.params.get("components")
	var viewComponentsYaml = bot.repeatString(components, "${key}: null\n")
	bot.generateYamlFile(
		"componentpack/" + namespace + "." + name + "/pack.yaml",
		{
			viewcomponents: viewComponentsYaml,
		},
		"pack.yaml"
	)
}
