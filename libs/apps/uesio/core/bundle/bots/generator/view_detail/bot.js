function view(bot) {
	var collection = bot.params.get("collection")
	var navView = bot.params.get("navview")
	var lastPartOfCollection = collection?.split(".")[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${lastPartOfCollection}_detail`
	var wirename = lastPartOfCollection || name
	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var formFieldsYaml = bot.repeatString(
		fields,
		"- uesio/io.field:\n    fieldId: ${key}\n"
	)

	var navContent = navView
		? bot.mergeYamlTemplate(
				{
					navView,
				},
				"templates/nav.yaml"
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
			navContent,
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
