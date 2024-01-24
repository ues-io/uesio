function route(bot) {
	const contextApp = bot.getAppFullName()
	let params = bot.params.getAll()
	// Strip off the context app name from the bot key
	// if it is the same as the current app
	if (params.bot && params.bot.startsWith(contextApp)) {
		params.bot = params.bot.slice(contextApp.length + 1)
	}
	bot.generateFile(
		`routes/${params.name}.yaml`,
		params,
		`templates/route_${params.type || "view"}.template.yaml`
	)
}
