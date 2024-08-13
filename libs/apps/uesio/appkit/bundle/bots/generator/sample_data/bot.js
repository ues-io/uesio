function sample_data(bot) {
	const appName = bot.getAppName()

	bot.log.info("here", appName)

	var collectionMeta = bot.load({
		collection: "uesio/core.collection",
		conditions: [
			{
				field: "uesio/core.namespace",
				value: appName,
			},
		],
	})

	bot.log.info("here2", collectionMeta)

	// Loop over the collections to generate sample data for.

	collectionMeta.forEach((collection) => {
		bot.runGenerator("uesio/appkit", "sample_data_collection", {
			collection: `${collection["uesio/core.namespace"]}.${collection["uesio/core.name"]}`,
		})
	})
}
