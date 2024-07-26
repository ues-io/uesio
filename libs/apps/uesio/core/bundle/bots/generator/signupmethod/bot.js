function signupmethod(bot) {
	var name = bot.params.get("name")
	var authSource = bot.params.get("authSource") || ""
	var profile = bot.params.get("profile") || ""
	var usernameTemplate = bot.params.get("usernameTemplate") || ""
	var landingRoute = bot.params.get("landingRoute") || ""
	var createLoginBot = bot.params.get("createLoginBot") || ""
	var signupBot = bot.params.get("signupBot") || ""
	var resetPasswordBot = bot.params.get("resetPasswordBot") || ""
	var usernameRegex = bot.params.get("usernameRegex") || ""
	var usernameFormatExplanation =
		bot.params.get("usernameFormatExplanation") || ""
	var autoLogin = bot.params.get("autoLogin") || ""
	var enableSelfSignup = bot.params.get("enableSelfSignup") || ""

	bot.generateFile(
		`signupmethods/${name}.yaml`,
		{
			name,
			authSource,
			profile,
			usernameTemplate,
			landingRoute,
			createLoginBot,
			signupBot,
			resetPasswordBot,
			usernameRegex,
			usernameFormatExplanation,
			autoLogin,
			enableSelfSignup,
		},
		"templates/signupmethod.yaml"
	)
}
