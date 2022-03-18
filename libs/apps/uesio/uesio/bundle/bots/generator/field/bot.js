function field(bot) {
	var name = bot.params.get("name")
	var collectionKey = bot.params.get("collection")
	var type = bot.params.get("type")
	var label = bot.params.get("label")
	var namespace = bot.getNamespace()
	bot.generateFile(
		"fields/" + collectionKey + "/" + namespace + "." + name + ".yaml",
		{
			name: name,
			type: type,
			label: label,
			collection: collectionKey,
		},
		"field.yaml"
	)
}
