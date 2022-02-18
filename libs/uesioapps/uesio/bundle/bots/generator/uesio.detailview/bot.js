function view(bot) {
	var name = bot.params.get("name")
	var collection = bot.params.get("collection")
	var fields = bot.params.get("fields")
	var wirename = bot.params.get("wirename")

	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var formFieldsYaml = bot.repeatString(fields, "- io.field: ${key}\n")

	var definition = bot.mergeYamlTemplate(
		{
			collection: collection,
			fields: fieldsYaml,
			formFields: formFieldsYaml,
			wirename: wirename,
		},
		"detailview.yaml"
	)

	bot.runGenerator("uesio", "view", {
		name: name,
		definition: definition,
	})
}
