function field(bot) {
	function help(template, parameters) {
		var params = parameters.reduce((prev, key) => {
			const value = bot.params.get(key)

			return value
				? {
						...prev,
						[key]: value,
				  }
				: prev
		}, null)

		if (!params) return null

		return bot.mergeYamlTemplate(params, template)
	}

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

	var number_definition = help("number.yaml", ["number_decimals"])
	var reference_definition = help("reference.yaml", ["ref_collection"])
	var selectlist_definition = help("selectlist.yaml", ["select_list"])
	var autonumber_definition = help("autonumber.yaml", [
		"autonumber_prefix",
		"autonumber_leadingzeros",
	])

	var field = [
		common_definition,
		number_definition,
		reference_definition,
		selectlist_definition,
		autonumber_definition,
	]
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
