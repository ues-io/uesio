function profile_public(bot) {
	const namespace = bot.getAppName()
	bot.runGenerator("uesio/core", "permissionset", {
		name: "public",
	})

	bot.runGenerator("uesio/core", "profile", {
		name: "public",
		permissionSets: [namespace + ".public"],
	})
}
