function view(bot) {
	var name = bot.params.get("name") || "nav"
	var logo = bot.params.get("logo")
	var collections = bot.params.get("collections") || ""
	var logoheight = bot.params.get("logoheight") || 34

	bot.runGenerator("uesio/core", "view_apptag", {
		logo,
		logoheight,
		collections,
	})

	bot.runGenerator("uesio/core", "view_profiletag", {})

	var definition = bot.mergeYamlTemplate({}, "templates/navview.yaml")

	bot.runGenerator("uesio/core", "view", {
		name: name,
		definition: definition,
	})
}
