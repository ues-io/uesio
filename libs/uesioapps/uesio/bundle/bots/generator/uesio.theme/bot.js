function theme(bot) {
	var name = bot.params.get("name")
	var namespace = bot.getNamespace()
	var primary = bot.params.get("primary")
	var secondary = bot.params.get("secondary")
	var error = bot.params.get("error")
	var warning = bot.params.get("warning")
	var info = bot.params.get("info")
	var success = bot.params.get("success")

	bot.generateFile(
		"themes/" + namespace + "." + name + ".yaml",
		{
			name: name,
			primary: primary,
			secondary: secondary,
			error: error,
			warning: warning,
			info: info,
			success: success,
		},
		"theme.yaml"
	)
}
