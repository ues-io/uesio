function view_login(bot) {
	bot.runGenerator("uesio/core", "route", {
		name: "login",
		path: "login",
		view: "uesio/core.login",
		theme: "uesio/core.default",
		title: "Login",
	})
}
