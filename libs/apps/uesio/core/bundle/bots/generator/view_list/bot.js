function view(bot) {
	var collection = bot.params.get("collection")
	var navComponent = bot.params.get("navcomponent")
	const collectionParts = collection?.split(".")
	const collectionNamespace = collectionParts[0]
	const collectionName = collectionParts[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${collectionName}_list`
	var wirename = collectionName || name
	var fieldsArray = fields.split(",")
	var fieldsYaml = fieldsArray.map((field) => `${field}:\n`).join("")
	var tableColumnsYaml = fieldsArray
		.map((field) => `- field: ${field}\n`)
		.join("")

	if (!navComponent) {
		bot.runGenerator("uesio/core", "component_nav", {})
		navComponent = collectionNamespace + ".nav"
	}

	var navContent = navComponent ? `- ${navComponent}:\n` : ""

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			navContent,
			fields: fieldsYaml,
			tableColumns: tableColumnsYaml,
			wirename,
		},
		"templates/listview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name,
		definition,
	})
}
