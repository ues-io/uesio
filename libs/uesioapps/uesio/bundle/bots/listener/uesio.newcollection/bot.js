function newcollection(bot) {
	var collection = bot.params.get("name")
	var datasource = bot.params.get("datasource")
	var app = bot.params.get("app")
	var workspace = bot.params.get("workspace")
	var workspaceId = app + "_" + workspace

	bot.save("uesio.collections", [{
		"uesio.name": collection,
		"uesio.datasource": datasource,
		"uesio.collectionname": collection,
		"uesio.workspaceid": workspaceId,
		"uesio.idfield": app + ".id",
		"uesio.namefield": app + ".name"
	}])
	bot.save("uesio.fields", [
		{
			"uesio.collection": app + "." + collection,
			"uesio.label": "Name",
			"uesio.name": "name",
			"uesio.propertyname": "name",
			"uesio.type": "TEXT",
			"uesio.workspaceid": workspaceId,
		},
		{
			"uesio.collection": app + "." + collection,
			"uesio.label": "Id",
			"uesio.name": "id",
			"uesio.propertyname": "id",
			"uesio.type": "TEXT",
			"uesio.workspaceid": workspaceId,
		},
	])
}
