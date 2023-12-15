function view(bot) {
	var collection = bot.params.get("collection")
	var headerView = bot.params.get("headerview")
	var lastPartOfCollection = collection?.split(".")[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${lastPartOfCollection}_detail`
	var wirename = lastPartOfCollection || name
	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var formFieldsYaml = bot.repeatString(
		fields,
		"- uesio/io.field:\n    fieldId: ${key}\n"
	)

	var headerContent = headerView
		? bot.mergeYamlTemplate(
				{
					headerView,
				},
				"templates/header.yaml"
		  )
		: ""

	var innerViewName = `${name}_content`

	var definition_inner = bot.mergeYamlTemplate(
		{
			collection,
			fields: fieldsYaml,
			formFields: formFieldsYaml,
			wirename,
		},
		"templates/detailview_content.yaml"
	)

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			innerView: innerViewName,
			headerContent,
		},
		"templates/detailview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name: innerViewName,
		definition: definition_inner,
	})

	bot.runGenerator("uesio/core", "view", {
		name,
		definition,
	})
}
