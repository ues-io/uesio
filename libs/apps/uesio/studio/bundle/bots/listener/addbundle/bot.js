function addbundle(bot) {
	const [bundleId, app, workspace] = [
		bot.params.get("bundle"),
		bot.params.get("app"),
		bot.params.get("workspace"),
	]
	const workspaceId = app + "_" + workspace

	// BundleId could be uesio/docs_v0.0.1 but also just be uesio/docs.
	// In the last situation, we should identify the last version
	const getBundleVersion = (b) => {
		const re = new RegExp("_v(0|[1-9]d*)(.(0|[1-9]d*)){0,3}$")
		const includesVersion = re.test(b)
		if (!includesVersion) {
			// 1.  Query bundle collection for latest version
			// 2. Return full id
		}
		return b
	}

	bot.save("uesio/studio.bundledependency", [
		{
			"uesio/studio.bundle": {
				"uesio/core.id": getBundleVersion(bundleId),
			},
			"uesio/studio.workspace": workspaceId,
		},
	])
}
