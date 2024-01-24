function view(bot) {
	var name = bot.params.get("name") || "profiletag"

	var definition = bot.mergeYamlTemplate({}, "templates/profiletag.yaml")

	bot.runGenerator("uesio/core", "view", {
		name: name,
		definition: definition,
	})
}
