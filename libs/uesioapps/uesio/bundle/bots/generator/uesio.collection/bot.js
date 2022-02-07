function collection(bot) {
	log("Running GEnerator for collection! woo!")
	var name = bot.params.get("name")
	var template =
		"name: ${name}\ndataSource: uesio.platform\nnameField: uesio.id\n"

	bot.generateFile(
		"collections/" + name + ".yaml",
		{
			name: name,
		},
		template
	)
}
