function view(bot) {
	var collection = bot.params.get("collection")
	var navView = bot.params.get("navview")
	var lastPartOfCollection = collection?.split(".")[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${lastPartOfCollection}_list`
	var wirename = lastPartOfCollection || name
	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var tableColumnsYaml = bot.repeatString(fields, "- field: ${key}\n")

	var navContent = navView
		? bot.mergeYamlTemplate(
				{
					navView,
				},
				"templates/nav.yaml"
		  )
		: ""

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
