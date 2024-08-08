function view_detail(bot) {
	const collection = bot.params.get("collection")
	const collectionParts = collection?.split(".")
	const collectionName = collectionParts[1]
	const wireName = collectionName
	const fields = bot.params.get("fields")
	const namespace = bot.getAppName()

	const builtin = [
		"uesio/core.updatedby",
		"uesio/core.updatedat",
		"uesio/core.createdby",
		"uesio/core.createdat",
		"uesio/core.owner",
	]

	const fieldsYaml = fields
		.concat(builtin)
		.map((field) => `${field}:\n`)
		.join("")
	const formFields = fields.map((field) => ({
		"uesio/io.field": {
			fieldId: field,
		},
	}))

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			namespace,
			fields: fieldsYaml,
			formFields,
			wirename: wireName,
		},
		"templates/detail.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name: `${collectionName}_detail`,
		definition,
	})

	bot.runGenerator("uesio/core", "route", {
		name: `${collectionName}_detail`,
		path: `${collectionName}/detail/{recordid}`,
		view: `${collectionName}_detail`,
		theme: "uesio/core.default",
		title: `${collectionName} Detail`,
	})

	bot.runGenerator("uesio/core", "routeassignment", {
		type: "detail",
		route: `${collectionName}_detail`,
		collection,
	})
}
