function profile_public(bot) {
	bot.runGenerator("uesio/core", "permissionset", {
		name: "public",
	})

	bot.runGenerator("uesio/core", "profile", {
		name: "public",
	})
}
