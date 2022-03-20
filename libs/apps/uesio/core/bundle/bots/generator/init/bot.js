function init(bot) {
	var name = bot.params.get("name")
	var params = {
		name: name,
	}
	bot.generateFile("package.json", params, "template.package.json")
	bot.generateFile("tsconfig.json", {}, "template.tsconfig.json")
	bot.generateFile("bundle/bundle.yaml", params, "template.bundle.yaml")
}
