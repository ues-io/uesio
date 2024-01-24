function view(bot) {
	var collection = bot.params.get("collection")
	var lastPartOfCollection = collection?.split(".")[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name")
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${lastPartOfCollection}_queue`
	var wirename = lastPartOfCollection || name
	var detailviewname = bot.params.get("detailview")

	var fieldsyaml = bot.repeatString(fields, "${key}:\n")
	var cardcontents =
		"- uesio/io.text:\n    text: $RecordMeta{name}\n    element: div\n"

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			fields: fieldsyaml,
			cardcontents,
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
