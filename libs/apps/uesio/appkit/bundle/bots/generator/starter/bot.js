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
