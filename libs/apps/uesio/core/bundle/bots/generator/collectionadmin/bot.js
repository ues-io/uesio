function collectionadmin(bot) {
	var collection = bot.params.get("collection")
	const collectionParts = collection.split(".")
	const collectionNamespace = collectionParts[0]
	const collectionName = collectionParts[1]

	var collectionMeta = bot.load({
		collection: "uesio/core.field",
		conditions: [
			{
				field: "uesio/core.grouping",
				value: collection,
			},
		],
	})

	var fields = collectionMeta
		.map((field) => {
			return `${field["uesio/core.namespace"]}.${field["uesio/core.name"]}`
		})
		.join(",")

	bot.runGenerator("uesio/core", "headerview", {
		logo: "uesio/core.logo",
		collections: collection,
	})

	bot.runGenerator("uesio/core", "listview", {
		headerview: collectionNamespace + ".header",
		collection: collection,
		fields: fields,
	})

	bot.runGenerator("uesio/core", "detailview", {
		headerview: collectionNamespace + ".header",
		collection: collection,
		fields: fields,
	})

	bot.runGenerator("uesio/core", "route", {
		name: collectionName + "list",
		path: collectionName,
		view: collectionName + "_list",
		theme: "uesio/core.default",
	})

	bot.runGenerator("uesio/core", "route", {
		name: collectionName + "detail",
		path: collectionName + "/{recordid}",
		view: collectionName + "_detail",
		theme: "uesio/core.default",
	})

	bot.runGenerator("uesio/core", "routeassignment", {
		type: "list",
		route: collectionName + "list",
		collection: collection,
	})

	bot.runGenerator("uesio/core", "routeassignment", {
		type: "detail",
		route: collectionName + "detail",
		collection: collection,
	})
}
