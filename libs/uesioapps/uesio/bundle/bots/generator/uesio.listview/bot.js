function view(bot) {
	var name = bot.params.get("name")
	var collection = bot.params.get("collection")
	//var fields = bot.params.get("fields")

	var definition = bot.mergeTemplate(
		{ collection, collection },
		"listview.yaml"
	)

	bot.runGenerator("uesio", "view", {
		name: name,
		definition: definition,
	})
}
