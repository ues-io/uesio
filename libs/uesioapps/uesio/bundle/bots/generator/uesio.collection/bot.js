function collection(bot) {
	var name = bot.params.get("name")
	bot.generateFile(
		"collections/" + name + ".yaml",
		{
			name: name,
		},
		"collection.yaml"
	)
}
