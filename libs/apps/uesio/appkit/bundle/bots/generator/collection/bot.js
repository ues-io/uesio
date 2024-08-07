function collection(bot) {
	var collectionName = bot.params.get("collection")
	var collectionLabel = bot.params.get("label")
	var collectionPluralLabel = bot.params.get("pluralLabel")

	const namespace = bot.getAppName()

	var fullCollectionName = namespace + "." + collectionName

	bot.runGenerator("uesio/core", "collection", {
		name: collectionName,
		label: collectionLabel,
		pluralLabel: collectionPluralLabel,
	})

	const result = bot.runIntegrationAction(
		"uesio/aikit.bedrock",
		"invokemodel",
		{
			model: "anthropic.claude-3-haiku-20240307-v1:0",
			messages: [
				{
					role: "user",
					content:
						"Please use the tool provided to create 5 fields for this database object called: " +
						collectionName,
				},
			],
			system: "You are an assistant who creates data models for databases.",
			tools: [
				{
					name: "create_fields",
					description: "Create fields for a database table",
					input_schema: {
						type: "object",
						properties: {
							fields: {
								type: "array",
								description: "The fields to create",
								items: {
									type: "object",
									properties: {
										name: {
											type: "string",
											description:
												"The field name. This should be snake case. No uppercase characters are allowed.",
										},
										type: {
											type: "string",
											description:
												"The data type of the field. The only valid values for this type are TEXT, NUMBER, or CHECKBOX",
										},
										label: {
											type: "string",
											description:
												"This is the nice, human-readable label for this field. It should start with a capital letter and spaces are allowed.",
										},
									},
									required: ["name"],
								},
							},
						},
						required: ["fields"],
					},
				},
			],
			tool_choice: {
				type: "tool",
				name: "create_fields",
			},
		}
	)

	if (!result.length) {
		throw new Error("Invalid Result")
	}

	//bot.log.info("ai result", result)

	const fields = result[0].input.fields

	const fieldIds = fields.map((field) => {
		bot.runGenerator("uesio/core", "field", {
			collection: fullCollectionName,
			name: field.name,
			label: field.label,
			type: field.type,
		})
		return namespace + "." + field.name
	})

	bot.runGenerator("uesio/appkit", "view_list", {
		collection: fullCollectionName,
		fields: fieldIds,
	})
}
