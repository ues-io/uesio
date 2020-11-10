function addfields(bot) {
	bot.results.get().forEach(function (result) {
		if (result.isNew()) {
			var collectionid = result.get("uesio.id")
			var workspaceid = result.get("uesio.workspaceid")
			bot.save("uesio.fields", [
				{
					"uesio.collection": collectionid,
					"uesio.label": "Name",
					"uesio.name": "name",
					"uesio.propertyname": "name",
					"uesio.type": "TEXT",
					"uesio.workspaceid": workspaceid,
				},
				{
					"uesio.collection": collectionid,
					"uesio.label": "Id",
					"uesio.name": "id",
					"uesio.propertyname": "id",
					"uesio.type": "TEXT",
					"uesio.workspaceid": workspaceid,
				},
			])
		}
	})
}
