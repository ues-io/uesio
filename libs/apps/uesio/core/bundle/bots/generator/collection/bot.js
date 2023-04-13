function collection(bot) {
	var name = bot.params.get("name")
	var label = bot.params.get("label")
	var pluralLabel = bot.params.get("pluralLabel")
	bot.generateFile(
		"collections/" + name + ".yaml",
		{
			name: name,
			label: label,
			pluralLabel: pluralLabel,
		},
		"templates/collection.yaml"
	)
}
