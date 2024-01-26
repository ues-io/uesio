function view(bot) {
	var collection = bot.params.get("collection")
	var navComponent = bot.params.get("navcomponent")
	var lastPartOfCollection = collection?.split(".")[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name")
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${lastPartOfCollection}_queue`
	var wirename = lastPartOfCollection || name
	var detailviewname = bot.params.get("detailview")

	var cardcontents =
		"- uesio/io.text:\n    text: $RecordMeta{name}\n    element: div\n"

	var navContent = navComponent
		? bot.mergeYamlTemplate(
				{
					navComponent,
					cardcontents,
					wirename,
				},
				"templates/queue.yaml"
		  )
		: ""
	var fieldsyaml = bot.repeatString(fields, "${key}:\n")

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			navContent,
			fields: fieldsyaml,
			wirename,
			detailviewname,
		},
		"templates/queueview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name,
		definition,
	})
}
