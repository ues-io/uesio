function view(bot) {
	var name = bot.params.get("name")
	var collection = bot.params.get("collection")
	var fields = bot.params.get("fields")
	var wirename = name + "Wire"
	var detailviewname = bot.params.get("detailview")
	var addheaderview = bot.params.get("addheaderview")
	var headerviewname = bot.params.get("headerview")

	var fieldsyaml = bot.repeatString(fields, "${key}:\n")
	var cardcontents = bot.repeatString(
		fields,
		"- uesio/io.text:\n    text: ${start}${key}${end}\n    element: div\n"
	)
	var headercontents = addheaderview
		? "- uesio/core.view:\n    view: " + headerviewname + "\n"
		: ""

	var definition = bot.mergeYamlTemplate(
		{
			collection: collection,
			fields: fieldsyaml,
			cardcontents: cardcontents,
			wirename: wirename,
			detailviewname: detailviewname,
			headercontents: headercontents,
		},
		"templates/queueview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name: name,
		definition: definition,
	})
}
