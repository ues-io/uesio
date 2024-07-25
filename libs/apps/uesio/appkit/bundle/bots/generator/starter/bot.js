function starter(bot) {
	// Create a nav view
	bot.runGenerator("uesio/appkit", "leftnav", {})

	// Create a home view/route
	bot.runGenerator("uesio/appkit", "home", {})

	// Create a settings view/route
	bot.runGenerator("uesio/appkit", "settings", {})

	// Create a users view/route
	bot.runGenerator("uesio/appkit", "users", {})

	// Create admin profile/permission set

	// Create public profile/permission set

	// Bundle it all
	const bundle = bot.createBundle("Appkit Starter")

	bot.createSite("prod", `v${bundle.major}.${bundle.minor}.${bundle.patch}`)

	// Create a site and domain
}
