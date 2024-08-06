function view_list(bot) {
	const collection = bot.params.get("collection")
	const collectionParts = collection?.split(".")
	const collectionName = collectionParts[1]
	const wireName = collectionName
	const fields = bot.params.get("fields")
	const namespace = bot.getAppName()

	const fieldsYaml = fields.map((field) => `${field}:\n`).join("")
	const tableColumnsYaml = fields
		.map((field) => `- field: ${field}\n`)
		.join("")

	bot.log.info("collection", collection)
	bot.log.info("fields", fields)

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			namespace,
			fields: fieldsYaml,
			tableColumns: tableColumnsYaml,
			wirename: wireName,
		},
		"templates/list.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name: `${collectionName}_list`,
		definition,
	})
	bot.runGenerator("uesio/core", "route", {
		name: `${collectionName}_list`,
		path: collectionName,
		view: `${collectionName}_list`,
		theme: "uesio/core.default",
		title: `${collectionName} List`,
	})

	bot.runGenerator("uesio/core", "routeassignment", {
		type: "list",
		route: `${collectionName}_list`,
		collection,
	})
}
