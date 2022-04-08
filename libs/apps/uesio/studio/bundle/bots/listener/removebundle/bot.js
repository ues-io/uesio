function removebundle(bot) {
	const [bundleId, app, workspace] = [
		bot.params.get("bundle"),
		bot.params.get("app"),
		bot.params.get("workspace"),
	]
	const workspaceId = app + "_" + workspace

	// We need a delete here
	// bot.delete("uesio/studio.bundledependency", [
	// 	{
	// 		"uesio/studio.bundle": {
	// 			"uesio/core.id": getBundleVersion(bundleId),
	// 		},
	// 		"uesio/studio.workspace": workspaceId,
	// 	},
	// ])
}
