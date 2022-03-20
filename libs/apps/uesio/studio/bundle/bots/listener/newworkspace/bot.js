function newworkspace(bot) {
	var workspace = bot.params.get("name")
	var app = bot.params.get("app")
	var workspaceId = app + "_" + workspace

	var IoVersion = "uesio/io_" + bot.studio.getBundleLastVersion("uesio/io")
	var UesioVersion =
		"uesio/core_" + bot.studio.getBundleLastVersion("uesio/core")

	bot.save("uesio/studio.workspaces", [
		{
			"uesio/studio.name": workspace,
			"uesio/studio.app": {
				"uesio/core.id": app,
			},
		},
	])

	bot.save("uesio/studio.bundledependencies", [
		{
			"uesio/studio.bundle": {
				"uesio/core.id": UesioVersion,
			},
			"uesio/studio.workspace": workspaceId,
		},
		{
			"uesio/studio.bundle": {
				"uesio/core.id": IoVersion,
			},
			"uesio/studio.workspace": workspaceId,
		},
	])
}
