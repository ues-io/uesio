function view(bot) {
	var name = bot.params.get("name") || "header"
	var logo = bot.params.get("logo")
	var collections = bot.params.get("collections")
	var logoheight = bot.params.get("logoheight") || 34

	var buttonTemplate = bot.mergeYamlTemplate({}, "templates/navbutton.yaml")

	var navButtonYaml = bot.repeatString(collections, buttonTemplate)

	var definition = bot.mergeYamlTemplate(
		{
			logo: logo,
			logoheight: logoheight,
			collections: collections,
			navcollections: navButtonYaml,
		},
		"templates/headerview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name: name,
		definition: definition,
	})
}
