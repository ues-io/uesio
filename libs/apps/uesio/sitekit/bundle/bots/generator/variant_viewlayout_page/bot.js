function variant_viewlayout_page(bot) {
	var namespace = bot.getAppName()
	const backgroundFile = bot.params.get("backgroundFile")
	const backgroundFilePath = bot.params.get("backgroundFilePath")
	var definition = bot.mergeYamlTemplate(
		{
			namespace,
			backgroundFile,
			backgroundFilePath,
		},
		"templates/page.yaml"
	)
	bot.runGenerator("uesio/core", "componentvariant", {
		name: "page",
		component: "uesio/io.viewlayout",
		extends: "uesio/sitekit.default",
		label: "Page",
		definition,
	})
}
