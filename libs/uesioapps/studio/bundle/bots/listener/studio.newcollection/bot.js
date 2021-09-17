function newcollection(bot) {
	var collection = bot.params.get("name")
	var datasource = bot.params.get("datasource")
	var app = bot.params.get("app")
	var workspace = bot.params.get("workspace")
	var workspaceId = app + "_" + workspace

	bot.save("studio.collections", [
		{
			"studio.name": collection,
			"studio.datasource": datasource,
			"studio.collectionname": collection,
			"studio.workspaceid": workspaceId,
			"studio.idfield": app + ".id",
			"studio.namefield": app + ".name",
		},
	])
	bot.save("studio.fields", [
		{
			"studio.collection": app + "." + collection,
			"studio.label": "Name",
			"studio.name": "name",
			"studio.type": "TEXT",
			"studio.workspaceid": workspaceId,
		},
		{
			"studio.collection": app + "." + collection,
			"studio.label": "Id",
			"studio.name": "id",
			"studio.type": "TEXT",
			"studio.workspaceid": workspaceId,
		},
		{
			"studio.collection": app + "." + collection,
			"studio.label": "Created By",
			"studio.name": "createdby",
			"studio.type": "USER",
			"studio.autopopulate": "CREATE",
			"studio.workspaceid": workspaceId,
		},
		{
			"studio.collection": app + "." + collection,
			"studio.label": "Updated By",
			"studio.name": "updatedby",
			"studio.type": "USER",
			"studio.autopopulate": "UPDATE",
			"studio.workspaceid": workspaceId,
		},
		{
			"studio.collection": app + "." + collection,
			"studio.label": "Created At",
			"studio.name": "createdat",
			"studio.type": "TIMESTAMP",
			"studio.autopopulate": "CREATE",
			"studio.workspaceid": workspaceId,
		},
		{
			"studio.collection": app + "." + collection,
			"studio.label": "Updated At",
			"studio.name": "updatedat",
			"studio.type": "TIMESTAMP",
			"studio.autopopulate": "UPDATE",
			"studio.workspaceid": workspaceId,
		},
	])
}
