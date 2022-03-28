function newcollection(bot) {
	var collection = bot.params.get("name")
	var datasource = bot.params.get("datasource")
	var app = bot.params.get("app")
	var workspace = bot.params.get("workspace")
	var workspaceId = app + "_" + workspace

	bot.save("uesio/studio.collection", [
		{
			"uesio/studio.name": collection,
			"uesio/studio.datasource": datasource,
			"uesio/studio.workspace": workspaceId,
			"uesio/studio.namefield": app + ".name",
		},
	])
	bot.save("uesio/studio.fields", [
		{
			"uesio/studio.collection": app + "." + collection,
			"uesio/studio.label": "Name",
			"uesio/studio.name": "name",
			"uesio/studio.type": "TEXT",
			"uesio/studio.workspace": workspaceId,
		},
	])
}
