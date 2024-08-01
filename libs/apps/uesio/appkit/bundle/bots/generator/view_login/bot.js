function view_login(bot) {
	bot.runGenerator("uesio/core", "route", {
		name: "login",
		path: "login",
		view: "uesio/core.login",
		theme: "uesio/core.default",
		title: "Login",
	})

	bot.runGenerator("uesio/core", "route", {
		name: "requestpassword",
		path: "requestpassword",
		view: "uesio/core.requestpassword",
		theme: "uesio/core.default",
		title: "Request Password",
	})
}
