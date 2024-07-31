function starter(bot) {
	// Create a nav view
	bot.runGenerator("uesio/appkit", "view_leftnav", {})

	// Create a home view/route
	bot.runGenerator("uesio/appkit", "view_home", {})

	// Create a settings view/route
	bot.runGenerator("uesio/appkit", "view_settings", {})

	// Create a users view/route
	bot.runGenerator("uesio/appkit", "view_users", {})

	// Create a login view/route
	bot.runGenerator("uesio/appkit", "view_login", {})

	// Create admin profile/permission set
	bot.runGenerator("uesio/appkit", "profile_admin", {})

	// Create public profile/permission set
	bot.runGenerator("uesio/appkit", "profile_public", {})

	// Create a signup method
	// Create public profile/permission set
	bot.runGenerator("uesio/appkit", "signupmethod_admin", {})

	// Set up the bundledef and other dependencies
	bot.runGenerator("uesio/appkit", "starter_bundledef", {})
}
