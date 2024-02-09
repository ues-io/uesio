function view(bot) {
	var collection = bot.params.get("collection")
	var navComponent = bot.params.get("navcomponent")
	const collectionParts = collection?.split(".")
	const collectionNamespace = collectionParts[0]
	const collectionName = collectionParts[1]
	var fields = bot.params.get("fields")
	var name = bot.params.get("name")
	var fields = bot.params.get("fields")
	var name = bot.params.get("name") || `${collectionName}_console`
	var wirename = collectionName || name
	var detailviewname = bot.params.get("detailview")

	var cardcontents =
		"- uesio/io.text:\n    text: $RecordMeta{name}\n    element: div\n"

	if (!navComponent) {
		bot.runGenerator("uesio/core", "component_nav", {})
		navComponent = collectionNamespace + ".nav"
	}

	var navContent = navComponent
		? bot.mergeYamlTemplate(
				{
					navComponent,
					cardcontents,
					wirename,
				},
				"templates/console.yaml"
			)
		: ""

	var fieldsArray = fields.split(",")
	var fieldsYaml = fieldsArray.map((field) => `${field}:\n`).join("")

	var definition = bot.mergeYamlTemplate(
		{
			collection,
			navContent,
			fields: fieldsYaml,
			wirename,
			detailviewname,
		},
		"templates/consoleview.yaml"
	)

	bot.runGenerator("uesio/core", "view", {
		name,
		definition,
	})
}
