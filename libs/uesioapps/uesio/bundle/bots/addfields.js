function addfields(bot) {
	bot.results.get().forEach(function (result) {
		if (result.isNew()) {
			var collectionId = result.get("uesio.id")
			var splitId = collectionId.split("_")
			var appName = splitId[0]
			var collectionName = splitId[2]
			var newId = appName + "." + collectionName
			var workspaceId = result.get("uesio.workspaceid")
			bot.save("uesio.fields", [
				{
					"uesio.collection": newId,
					"uesio.label": "Name",
					"uesio.name": "name",
					"uesio.propertyname": "name",
					"uesio.type": "TEXT",
					"uesio.workspaceid": workspaceId,
				},
				{
					"uesio.collection": newId,
					"uesio.label": "Id",
					"uesio.name": "id",
					"uesio.propertyname": "id",
					"uesio.type": "TEXT",
					"uesio.workspaceid": workspaceId,
				},
			])
		}
	})
}
