function collectionadmin(bot) {
	var collection = bot.params.get("collection")
	const collectionParts = collection.split(".")
	const collectionNamespace = collectionParts[0]
	const collectionName = collectionParts[1]

	var collectionFieldsMeta = bot.load({
		collection: "uesio/core.field",
		conditions: [
			{
				field: "uesio/core.grouping",
				value: collection,
			},
		],
	})

	var collectionMeta = bot.load({
		collection: "uesio/core.collection",
		conditions: [
			{
				field: "uesio/core.item",
				value: collection,
			},
		],
	})

	var fields = collectionFieldsMeta
		.map((field) => {
			return `${field["uesio/core.namespace"]}.${field["uesio/core.name"]}`
		})
		.join(",")

	var collectionLabel = collectionMeta[0]["uesio/core.label"]

	bot.runGenerator("uesio/core", "component_nav", {})

	bot.runGenerator("uesio/core", "view_list", {
		navcomponent: collectionNamespace + ".nav",
		collection: collection,
		fields: fields,
	})

	bot.runGenerator("uesio/core", "view_detail", {
		navcomponent: collectionNamespace + ".nav",
		collection: collection,
		fields: fields,
	})

	bot.runGenerator("uesio/core", "view_queue", {
		navcomponent: collectionNamespace + ".nav",
		collection: collection,
		fields: fields,
		detailview: collectionName + "_detail_content",
	})

	bot.runGenerator("uesio/core", "route", {
		name: collectionName + "list",
		path: collectionName,
		view: collectionName + "_list",
		theme: "uesio/core.default",
		title: collectionLabel + " List View",
	})

	bot.runGenerator("uesio/core", "route", {
		name: collectionName + "queue",
		path: collectionName,
		view: collectionName + "_queue",
		theme: "uesio/core.default",
		title: collectionLabel + " Queue View",
	})

	bot.runGenerator("uesio/core", "route", {
		name: collectionName + "detail",
		path: collectionName + "/{recordid}",
		view: collectionName + "_detail",
		theme: "uesio/core.default",
		title: collectionLabel + " Detail View",
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
