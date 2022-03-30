function newcollection(bot) {
	var collection = bot.params.get("name")
	var label = bot.params.get("label")
	var plurallabel = bot.params.get("plurallabel")
	var datasource = bot.params.get("datasource")
	var app = bot.params.get("app")
	var workspace = bot.params.get("workspace")
	var workspaceId = app + "_" + workspace

	bot.save("uesio/studio.collection", [
		{
			"uesio/studio.name": collection,
			"uesio/studio.label": label,
			"uesio/studio.plurallabel": plurallabel,
			"uesio/studio.datasource": datasource,
			"uesio/studio.workspace": workspaceId,
			"uesio/studio.namefield": app + ".name",
		},
	])
	bot.save("uesio/studio.field", [
		{
			"uesio/studio.collection": app + "." + collection,
			"uesio/studio.label": "Name",
			"uesio/studio.name": "name",
			"uesio/studio.type": "TEXT",
			"uesio/studio.workspace": workspaceId,
		},
	])
}
