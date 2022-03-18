function view(bot) {
	var name = bot.params.get("name")
	var collection = bot.params.get("collection")
	var fields = bot.params.get("fields")

	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var tableColumnsYaml = bot.repeatString(
		fields,
		"- io.column:\n    field: ${key}\n"
	)

	var definition = bot.mergeYamlTemplate(
		{
			collection: collection,
			fields: fieldsYaml,
			tableColumns: tableColumnsYaml,
		},
		"listview.yaml"
	)

	bot.runGenerator("uesio", "view", {
		name: name,
		definition: definition,
	})
}
