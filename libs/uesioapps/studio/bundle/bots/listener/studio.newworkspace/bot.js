function newworkspace(bot) {
	var workspace = bot.params.get("name")
	var app = bot.params.get("app")
	var workspaceId = app + "_" + workspace

	var IoVersion = "io_" + bot.studio.getBundleLastVersion("io")
	var UesioVersion = "uesio_" + bot.studio.getBundleLastVersion("uesio")

	bot.save("studio.workspaces", [
		{
			"studio.name": workspace,
			"studio.app": {
				"uesio.id": app,
			},
		},
	])

	bot.save("studio.bundledependencies", [
		{
			"studio.bundle": {
				"uesio.id": UesioVersion,
			},
			"studio.workspaceid": workspaceId,
		},
		{
			"studio.bundle": {
				"uesio.id": IoVersion,
			},
			"studio.workspaceid": workspaceId,
		},
	])
}
