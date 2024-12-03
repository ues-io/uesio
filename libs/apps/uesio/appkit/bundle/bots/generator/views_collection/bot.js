function views_collection(bot) {
	var fullCollectionName = bot.params.get("collection")
	var fieldIds = bot.params.get("fields")

	bot.runGenerator("uesio/appkit", "view_list", {
		collection: fullCollectionName,
		fields: fieldIds,
	})

	bot.runGenerator("uesio/appkit", "view_detail", {
		collection: fullCollectionName,
		fields: fieldIds,
	})

	bot.runGenerator("uesio/appkit", "view_new", {
		collection: fullCollectionName,
		fields: fieldIds,
	})
}
