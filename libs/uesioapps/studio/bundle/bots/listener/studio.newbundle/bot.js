function newbundle(bot) {
	var app = bot.params.get("app")
	var workspace = bot.params.get("workspace")
	bot.studio.createBundle(app, workspace)
}
