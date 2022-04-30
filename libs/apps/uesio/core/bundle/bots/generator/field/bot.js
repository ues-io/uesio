function field(bot) {
	var name = bot.params.get("name")
	var collectionKey = bot.params.get("collection")
	var type = bot.params.get("type")
	var label = bot.params.get("label")
	const parts = collectionKey.split(".")
	bot.generateFile(
		"fields/" + parts[0] + "/" + parts[1] + "/" + name + ".yaml",
		{
			name: name,
			type: type,
			label: label,
			collection: collectionKey,
		},
		"field.yaml"
	)
}
