function view(bot) {
	var name = bot.params.get("name")
	var logo = bot.params.get("logo")
	var collections = bot.params.get("collections")
	var backgroundcolor = bot.params.get("backgroundcolor")
	var logoheight = bot.params.get("logoheight")

	var navButtonYaml = bot.repeatString(
		collections,
		"- uesio/io.button:\n    text: ${key}\n    uesio.variant: uesio/io.nav\n"
	)

	var definition = bot.mergeYamlTemplate(
		{
			logo: logo,
			logoheight: logoheight,
			backgroundcolor: backgroundcolor,
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
