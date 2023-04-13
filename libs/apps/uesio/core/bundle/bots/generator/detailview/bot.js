function view(bot) {
	var name = bot.params.get("name")
	var collection = bot.params.get("collection")
	var fields = bot.params.get("fields")
	var wirename = name + "Wire"

	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var formFieldsYaml = bot.repeatString(
		fields,
		"- uesio/io.field:\n    fieldId: ${key}\n"
	)

	var definition = bot.mergeYamlTemplate(
		{
			collection: collection,
			fields: fieldsYaml,
			formFields: formFieldsYaml,
			wirename: wirename,
		},
		"templates/detailview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name: name,
		definition: definition,
	})
}
