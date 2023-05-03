function init(bot) {
	var name = bot.params.get("name")
	var params = {
		name,
	}
	bot.generateFile(".gitignore", params, "templates/template.gitignore")
	bot.generateFile("tsconfig.json", {}, "templates/template.tsconfig.json")
	bot.generateFile("package.json", params, "templates/template.package.json")
	bot.generateFile(
		"bundle/bundle.yaml",
		params,
		"templates/template.bundle.yaml"
	)
}
