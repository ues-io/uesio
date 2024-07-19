function home(bot) {
	var definition = bot.mergeYamlTemplate({}, "templates/home.yaml")
	bot.runGenerator("uesio/core", "view", {
		name: "home",
		definition,
	})
}
