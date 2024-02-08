function component_nav(bot) {
	var logo = bot.params.get("logo")
	var logoheight = bot.params.get("logoheight") || 34

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
