function component_nav(bot) {
	var logo = bot.params.get("logo")
	var logoheight = bot.params.get("logoheight") || 34

	var buttonTemplate = bot.getTemplate("templates/navbutton.yaml")

	var collectionMeta = bot.load({
		collection: "uesio/core.collection",
		conditions: [
			{
				field: "uesio/core.namespace",
				value: bot.getAppFullName(),
			},
		],
	})

	var navButtons = collectionMeta
		.map((record) => {
			const namespace = record["uesio/core.namespace"]
			const name = record["uesio/core.name"]
			const label = record["uesio/core.label"]
			const pluralLabel = record["uesio/core.plurallabel"]
			const key = namespace + "." + name
			return bot.mergeYamlString(
				{
					label: pluralLabel || label,
					key,
				},
				buttonTemplate
			)
		})
		.join("\n")

	var logoContent = logo
		? bot.mergeYamlTemplate(
				{
					logo: logo,
					logoheight: logoheight,
				},
				"templates/navlogo.yaml"
		  )
		: bot.mergeYamlTemplate(
				{
					appicon: bot.getAppIcon(),
					appcolor: '"' + bot.getAppColor() + '"',
				},
				"templates/navicon.yaml"
		  )

	var definition = bot.mergeYamlTemplate(
		{
			logoContent,
			navcollections: navButtons,
			appname: bot.getAppName(),
		},
		"templates/nav.yaml"
	)
	bot.runGenerator("uesio/core", "component", {
		type: "DECLARATIVE",
		name: "nav",
		definition,
	})
}
