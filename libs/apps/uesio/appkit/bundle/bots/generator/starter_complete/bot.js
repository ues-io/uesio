function starter_complete(bot) {
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

	bot.createUser({
		siteId: site.id,
		firstName: "George",
		lastName: "Washington",
		username: "george",
		email: "plusplusben@gmail.com",
		profile: appName + ".admin",
		signupMethod: appName + ".admin",
	})
}
