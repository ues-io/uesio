function newworkspace(bot) {
	var workspace = bot.params.get("name")
	var app = bot.params.get("app")
	var workspaceId = app + "_" + workspace

	var IoVersion = "uesio/io_" + bot.studio.getBundleLastVersion("uesio/io")
	var UesioVersion =
		"uesio/uesio_" + bot.studio.getBundleLastVersion("uesio/uesio")

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
			"studio.workspace": workspaceId,
		},
		{
			"studio.bundle": {
				"uesio.id": IoVersion,
			},
			"studio.workspace": workspaceId,
		},
	])
}
