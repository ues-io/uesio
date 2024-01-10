function signupmethod(bot) {
	const params = bot.params.getAll()
	const { signupMethodName } = params
	// In order to avoid conflicts with Generator merges clobbering JS variable merges
	// inside of our Bot template files, we will just replace all JS merges in the template files,
	// e.g. we will just have "code" => "${code}", "link" => "${link}", etc.
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
		const botName = `${signupMethodName}_${name}`
		const path = `bots/listener/${botName}/bot`
		bot.generateFile(
			`${path}.ts`,
			newBotParams,
			`templates/${name}_bot.template.ts`
		)
		bot.generateFile(
			`${path}.yaml`,
			{ ...params, name: botName },
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
		`signupmethods/${signupMethodName}.yaml`,
		{ ...params, username: "${username}" },
		"templates/signupmethod.template.yaml"
	)
}
