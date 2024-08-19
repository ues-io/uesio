function collection(bot) {
	var name = bot.params.get("name")
	var label = bot.params.get("label")
	var pluralLabel = bot.params.get("pluralLabel")
	var nameField = bot.params.get("nameField")
	bot.generateFile(
		"collections/" + name + ".yaml",
		{
			name,
			label,
			pluralLabel,
			nameField,
		},
		"templates/collection.yaml"
	)
}
