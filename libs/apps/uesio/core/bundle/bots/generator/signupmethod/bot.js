function signupmethod(bot) {
	const params = bot.params.getAll()
	// In order to avoid conflicts with JS merge templates,
	// we need to just duplicate all params in the template files
	const escapeMerges = [
		"code",
		"username",
		"lastName",
		"firstName",
		"link",
		"toName",
		"host",
		"redirect",
	]
	const newBotParams = {
		...params,
	}
	escapeMerges.forEach((param) => {
		newBotParams[param] = "${" + param + "}"
	})
	// Create the 3 bots TS and YAML files
	const botNames = ["signup", "createlogin", "forgotpassword"]
	botNames.forEach((name) => {
		const path = `bots/listener/${name}/bot`
		bot.generateFile(
			`${path}.ts`,
			newBotParams,
			`templates/${name}_bot.template.ts`
		)
		bot.generateFile(
			`${path}.yaml`,
			{ ...params, name },
			"templates/bot.template.yaml"
		)
	})

	// Create the signup landing route
	bot.generateFile(
		"routes/signuplanding.yaml",
		params,
		"templates/landingroute.template.yaml"
	)
	// Finally generate the signup method itself
	bot.generateFile(
		`signupmethods/${params.signupMethodName}.yaml`,
		{ ...params, username: "${username}" },
		"templates/signupmethod.template.yaml"
	)
}
