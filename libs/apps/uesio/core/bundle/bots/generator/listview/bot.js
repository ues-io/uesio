function view(bot) {
	var name = bot.params.get("name")
	var collection = bot.params.get("collection")
	var fields = bot.params.get("fields")
	var wirename = bot.params.get("wirename")

	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var tableColumnsYaml = bot.repeatString(fields, "- field: ${key}\n")

	var definition = bot.mergeYamlTemplate(
		{
			collection: collection,
			fields: fieldsYaml,
			tableColumns: tableColumnsYaml,
			wirename: wirename,
		},
		"templates/listview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name: name,
		definition: definition,
	})
}
