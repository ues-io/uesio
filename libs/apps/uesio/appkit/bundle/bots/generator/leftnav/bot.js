function leftnav(bot) {
	var definition = bot.mergeYamlTemplate({}, "templates/leftnav.yaml")
	bot.runGenerator("uesio/core", "view", {
		name: "leftnav",
		definition,
	})
}
