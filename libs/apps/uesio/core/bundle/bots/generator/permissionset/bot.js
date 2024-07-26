function permissionset(bot) {
	var name = bot.params.get("name")
	var namedPermissions = bot.params.get("namedPermissions") || "{}"

	var views = bot.params.get("views") || "{}"
	var collections = bot.params.get("collections") || "{}"
	var routes = bot.params.get("routes") || "{}"
	var files = bot.params.get("files") || "{}"
	var bots = bot.params.get("bots") || "{}"
	var integrationActions = bot.params.get("integrationActions") || "{}"

	var allowAllBots = bot.params.get("allowAllBots") || false
	var allowAllCollections = bot.params.get("allowAllCollections") || false
	var allowAllViews = bot.params.get("allowAllViews") || false
	var allowAllRoutes = bot.params.get("allowAllRoutes") || false
	var allowAllFiles = bot.params.get("allowAllFiles") || false
	var allowAllIntegrationActions =
		bot.params.get("allowAllIntegrationActions") || false

	var modifyAllRecords = bot.params.get("modifyAllRecords") || false
	var viewAllRecords = bot.params.get("viewAllRecords") || false

	bot.generateYamlFile(
		"permissionsets/" + name + ".yaml",
		{
			name,
			namedPermissions,
			views,
			collections,
			routes,
			files,
			bots,
			integrationActions,
			allowAllBots,
			allowAllCollections,
			allowAllViews,
			allowAllRoutes,
			allowAllFiles,
			allowAllIntegrationActions,
			modifyAllRecords,
			viewAllRecords,
		},
		"templates/permissionset.yaml"
	)
}
