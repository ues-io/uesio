function newbundle(bot) {
	var app = bot.params.get("app")
	var workspace = bot.params.get("workspace")
	var workspaceId = app + "_" + workspace

	log(workspaceId)
}
