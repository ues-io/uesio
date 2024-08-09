function collection(bot) {
	var collectionName = bot.params.get("collection")
	var collectionLabel = bot.params.get("label")
	var collectionPluralLabel = bot.params.get("pluralLabel")
	var existingCollections = bot.params.get("existingCollections")

	const namespace = bot.getAppName()

	var fullCollectionName = namespace + "." + collectionName

	bot.runGenerator("uesio/core", "collection", {
		name: collectionName,
		label: collectionLabel,
		pluralLabel: collectionPluralLabel,
	})

	const modelID = "anthropic.claude-3-haiku-20240307-v1:0"

	const systemPrompt = `
		You are an assistant who specializes in creating data models for databases.
		You deeply understand relational databases and seek to complete the task in
		the simplest and most straightforward way possible.
	`

	const prompt = `
		Use the tool provided to create between 5 and 10 fields for
		a database table called: ${collectionName}. The primary key for this table as well
		as audit fields such as created date, updated date, created by and updated by already
		exist and should not be created again.
	`

	const nameParam = {
		type: "string",
		description: `
			The field name. This should be snake case. No uppercase characters are allowed.
			For fields of type REFERENCE, do not include "id" in the name.
		`,
	}

	const typeParam = {
		type: "string",
		description: `
			The data type of the field. The only valid values for this type are
			TEXT, NUMBER, CHECKBOX, DATE, FILE or REFERENCE.
			Fields of type REFERENCE mean that they provide a foreign-key relationship
			to another table.
		`,
	}

	const labelParam = {
		type: "string",
		description: `
			This is the human-readable label for this field. It should start with a
			capital letter and spaces are allowed.
			For fields of type REFERENCE, do not put "ID" in the label.
		`,
	}

	const referencedCollectionParam = {
		type: "string",
		description: `
			Only provide a value for this parameter if the field's type is REFERENCE.
			If it is reference, chose the table that this field is a foreign key
			reference to from one of the following tables. And use that table's name
			as the value for this parameter.
			${existingCollections.join("\n")}
			The only valid values for this parameter are in the list above.
		`,
	}

	const acceptTypeParam = {
		type: "string",
		description: `
			Only provide a value for this parameter if the field's type is FILE.
			If set, the valid values for this parameter are IMAGE, DOCUMENT, or ANY.
		`,
	}

	const createFieldsTool = {
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
							name: nameParam,
							type: typeParam,
							label: labelParam,
							referencedCollection: referencedCollectionParam,
							accept: acceptTypeParam,
						},
						required: ["name", "type", "label"],
					},
				},
			},
			required: ["fields"],
		},
	}

	const result = bot.runIntegrationAction(
		"uesio/aikit.bedrock",
		"invokemodel",
		{
			model: modelID,
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
			system: systemPrompt,
			tools: [createFieldsTool],
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
			ref_collection: field.referencedCollection,
			accept: field.accept,
		})
		return namespace + "." + field.name
	})

	bot.runGenerator("uesio/appkit", "view_list", {
		collection: fullCollectionName,
		fields: fieldIds,
	})

	bot.runGenerator("uesio/appkit", "view_detail", {
		collection: fullCollectionName,
		fields: fieldIds,
	})

	bot.runGenerator("uesio/appkit", "view_new", {
		collection: fullCollectionName,
		fields: fieldIds,
	})
}
