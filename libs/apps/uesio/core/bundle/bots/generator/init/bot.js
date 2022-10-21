function init(bot) {
	var name = bot.params.get("name")
	var params = {
		name: name,
	}
	bot.generateFile(".gitignore", params, "template.gitignore")
	bot.generateFile("bundle/bundle.yaml", params, "template.bundle.yaml")
}
