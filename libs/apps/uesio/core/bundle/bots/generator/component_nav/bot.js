function component_nav(bot) {
	var logo = bot.params.get("logo")
	var logoheight = bot.params.get("logoheight") || 34

	var buttonTemplate = bot.getTemplate("templates/navbutton.yaml")

	var collectionMeta = bot.load({
		collection: "uesio/core.collection",
		conditions: [
			{
				field: "uesio/core.namespace",
				value: bot.getAppName(),
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

	var appData = bot.getApp()

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
					appicon: appData.getIcon(),
					appcolor: '"' + appData.getColor() + '"',
				},
				"templates/navicon.yaml"
		  )

	var definition = bot.mergeYamlTemplate(
		{
			logoContent,
			navcollections: navButtons,
			appname: appData.getName(),
		},
		"templates/nav.yaml"
	)
	bot.runGenerator("uesio/core", "component", {
		type: "DECLARATIVE",
		name: "nav",
		definition,
	})
}
