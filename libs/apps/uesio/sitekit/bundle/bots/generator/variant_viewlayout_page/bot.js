function variant_viewlayout_page(bot) {
	var namespace = bot.getAppName()
	var definition = bot.mergeYamlTemplate(
		{
			namespace,
		},
		"templates/page.yaml"
	)
	bot.runGenerator("uesio/core", "componentvariant", {
		name: "page",
		component: "uesio/io.viewlayout",
		extends: "uesio/io.default",
		label: "Page",
		definition,
	})
}
