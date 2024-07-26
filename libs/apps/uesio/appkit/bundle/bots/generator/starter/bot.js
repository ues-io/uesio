function starter(bot) {
	// Create a nav view
	bot.runGenerator("uesio/appkit", "view_leftnav", {})

	// Create a home view/route
	bot.runGenerator("uesio/appkit", "view_home", {})

	// Create a settings view/route
	bot.runGenerator("uesio/appkit", "view_settings", {})

	// Create a users view/route
	bot.runGenerator("uesio/appkit", "view_users", {})

	// Create admin profile/permission set
	bot.runGenerator("uesio/appkit", "profile_admin", {})

	// Create public profile/permission set
	bot.runGenerator("uesio/appkit", "profile_public", {})

	// Create a signup method

	// Bundle it all
	const bundle = bot.createBundle({
		description: "Appkit Starter",
		releaseType: "patch",
	})

	const version = `v${bundle.major}.${bundle.minor}.${bundle.patch}`
	const siteName = "prod"
	const appName = bot.getAppName()
	const subdomain = `${appName.replaceAll("/", "-")}-${siteName}`

	// Create Site and domain
	const site = bot.createSite({
		siteName,
		subdomain,
		version,
	})

	bot.log.info("siteid", site.id)
}
