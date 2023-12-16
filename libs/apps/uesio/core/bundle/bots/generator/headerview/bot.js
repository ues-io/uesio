function view(bot) {
	var name = bot.params.get("name") || "header"
	var logo = bot.params.get("logo")
	var collections = bot.params.get("collections") || ""
	var logoheight = bot.params.get("logoheight") || 34

	var buttonTemplate = bot.getTemplate("templates/navbutton.yaml")

	var collectionMeta = bot.load({
		collection: "uesio/core.collection",
	})

	var labelMap = {}

	collectionMeta.forEach((record) => {
		const namespace = record["uesio/core.namespace"]
		const name = record["uesio/core.name"]
		const label = record["uesio/core.label"]
		const pluralLabel = record["uesio/core.plurallabel"]
		const key = namespace + "." + name
		labelMap[key] = pluralLabel || label
	})

	var navButtons = collections
		.split(",")
		.map((collection) => {
			return bot.mergeYamlString(
				{
					label: labelMap[collection],
					key: collection,
				},
				buttonTemplate
			)
		})
		.join("")

	var definition = bot.mergeYamlTemplate(
		{
			logo: logo,
			logoheight: logoheight,
			collections: collections,
			navcollections: navButtons,
		},
		"templates/headerview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name: name,
		definition: definition,
	})
}
