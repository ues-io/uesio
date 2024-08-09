function profile_admin(bot) {
	const namespace = bot.getAppName()
	bot.runGenerator("uesio/core", "permissionset", {
		name: "admin",
		namedPermissions: {
			"uesio/core.user_admin": true,
		},
		allowAllBots: true,
		allowAllIntegrationActions: true,
		allowAllRoutes: true,
		allowAllViews: true,
		allowAllFiles: true,
		allowAllCollections: true,
		modifyAllRecords: true,
		viewAllRecords: true,
	})

	bot.runGenerator("uesio/core", "profile", {
		name: "admin",
		permissionSets: [namespace + ".admin"],
	})
}
