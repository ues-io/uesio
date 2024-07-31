function profile_admin(bot) {
	const namespace = bot.getAppName()
	bot.runGenerator("uesio/core", "permissionset", {
		name: "admin",
		allowAllBots: true,
		allowAllIntegrationActions: true,
		allowAllRoutes: true,
		allowAllViews: true,
		allowAllFiles: true,
		allowAllCollections: true,
	})

	bot.runGenerator("uesio/core", "profile", {
		name: "admin",
		permissionSets: [namespace + ".admin"],
	})
}
