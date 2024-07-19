function starter(bot) {
	bot.log.info("This works", bot.params)
	// Create a nav view
	bot.runGenerator("uesio/appkit", "leftnav", {})

	// Create a home view/route
	bot.runGenerator("uesio/appkit", "home", {})

	// Create a settings view/route

	// Create admin profile/permission set

	// Create public profile/permission set

	// Bundle it all

	// Create a site and domain
}
