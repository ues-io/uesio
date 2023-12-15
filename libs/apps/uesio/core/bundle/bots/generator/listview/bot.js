function view(bot) {
	var collection = bot.params.get("collection")
	var headerView = bot.params.get("headerview")
	var lastPartOfCollection = collection?.split(".")[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${lastPartOfCollection}_list`
	var wirename = lastPartOfCollection || name
	var fieldsYaml = bot.repeatString(fields, "${key}:\n")
	var tableColumnsYaml = bot.repeatString(fields, "- field: ${key}\n")

	var headerContent = headerView
		? bot.mergeYamlTemplate(
				{
					headerView,
				},
				"templates/header.yaml"
		  )
		: ""

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			headerContent,
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
