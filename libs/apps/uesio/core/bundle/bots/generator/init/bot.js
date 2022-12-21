function init(bot) {
	var name = bot.params.get("name")
	var params = {
		name: name,
	}
	bot.generateFile(".gitignore", params, "templates/template.gitignore")
	bot.generateFile(
		"bundle/bundle.yaml",
		params,
		"templates/template.bundle.yaml"
	)
}
