function signupmethod_admin(bot) {
	const namespace = bot.getAppName()

	bot.runGenerator("uesio/core", "signupmethod", {
		name: "admin",
		authSource: "uesio/core.platform",
		profile: namespace + ".admin",
		usernameTemplate: "${username}",
		autoLogin: false,
		enableSelfSignup: false,
		createLoginBot: "",
		resetPasswordBot: "",
	})
}
