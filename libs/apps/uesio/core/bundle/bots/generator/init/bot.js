function init(bot) {
	var name = bot.params.get("name")
	var params = {
		name: name,
	}
	bot.generateFile("bundle/bundle.yaml", params, "template.bundle.yaml")
}
