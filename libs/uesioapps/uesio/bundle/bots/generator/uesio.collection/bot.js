function collection(bot) {
	var name = bot.params.get("name")
	var namespace = bot.getNamespace()
	bot.generateFile(
		"collections/" + namespace + "." + name + ".yaml",
		{
			name: name,
		},
		"collection.yaml"
	)
}
