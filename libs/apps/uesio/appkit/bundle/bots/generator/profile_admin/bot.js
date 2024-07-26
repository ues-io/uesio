function profile_admin(bot) {
	bot.runGenerator("uesio/core", "permissionset", {
		name: "admin",
	})

	bot.runGenerator("uesio/core", "profile", {
		name: "admin",
	})
}
