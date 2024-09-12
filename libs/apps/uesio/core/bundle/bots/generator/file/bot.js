function file(bot) {
	var name = bot.params.get("name")
	var path = bot.params.get("path")
	var data = bot.params.get("data")

	bot.generateBase64File("files/" + name + "/" + path, data)

	bot.generateYamlFile(
		"files/" + name + "/file.yaml",
		{
			name,
			path,
		},
		"templates/file.yaml"
	)
}
