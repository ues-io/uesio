function view(bot) {
	var collection = bot.params.get("collection")
	var lastPartOfCollection = collection?.split(".")[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${lastPartOfCollection}_detail`
	var wirename = lastPartOfCollection || name
	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var formFieldsYaml = bot.repeatString(
		fields,
		"- uesio/io.field:\n    fieldId: ${key}\n"
	)

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			fields: fieldsYaml,
			formFields: formFieldsYaml,
			wirename,
		},
		"templates/detailview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name,
		definition,
	})
}
