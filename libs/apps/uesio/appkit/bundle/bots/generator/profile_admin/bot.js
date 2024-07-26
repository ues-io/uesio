function profile_admin(bot) {
	const namespace = bot.getAppName()
	bot.runGenerator("uesio/core", "permissionset", {
		name: "admin",
	})

	bot.runGenerator("uesio/core", "profile", {
		name: "admin",
		permissionSets: [namespace + ".admin"],
	})
}
