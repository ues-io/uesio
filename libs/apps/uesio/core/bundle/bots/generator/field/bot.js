function field(bot) {
	var name = bot.params.get("name")
	var collectionKey = bot.params.get("collection")
	var type = bot.params.get("type")
	var label = bot.params.get("label")

	//Common part for all fields
	var common_definition = bot.mergeYamlTemplate(
		{
			name: name,
			type: type,
			label: label,
			collection: collectionKey,
		},
		"common.yaml"
	)

	//number
	var number_definition = bot.params.get("number")
		? bot.mergeYamlTemplate(
				{
					number: bot.params.get("number"),
				},
				"number.yaml"
		  )
		: null

	var field = [common_definition, number_definition]
		.filter((val) => val)
		.join("")

	const parts = collectionKey.split(".")
	bot.generateFile(
		"fields/" + parts[0] + "/" + parts[1] + "/" + name + ".yaml",
		{
			definition: field,
		},
		"field.yaml"
	)
}
