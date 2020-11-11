function setfields(bot) {
	bot.changes.get().forEach(function (change) {
		if (change.isNew()) {
			var collectionName = change.get("uesio.name")
			var workspaceId = change.get("uesio.workspaceid")
			var splitwWrkspaceId = workspaceId.split("_")
			var appName = splitwWrkspaceId[0]

			change.set("uesio.collectionname", collectionName)
			change.set("uesio.idfield", appName + ".id")
			change.set("uesio.namefield", appName + ".name")
		}
	})
}
