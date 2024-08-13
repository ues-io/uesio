function sample_data_collection(bot) {
	const collection = bot.params.get("collection")
	bot.log.info("Getting sample data for collection: " + collection)

	var collectionFieldsMeta = bot.load({
		collection: "uesio/core.field",
		conditions: [
			{
				field: "uesio/core.grouping",
				value: collection,
			},
		],
	})

	const modelID = "anthropic.claude-3-haiku-20240307-v1:0"
	const appInfo = bot.getApp()
	const appName = bot.getAppName()
	const description = appInfo.description

	const systemPrompt = `
		You are an assistant who specializes in creating sample data for databases.
		You want to create interesting and playful data for demo purposes, but also data
		that is relevant to the instructions given.
	`

	const prompt = `
		Use the tool provided to create 5 records of sample data for an app called: ${appName}
		with a description of : ${description}. The name of the table that you are
		creating data for is ${collection}.
	`

	const requiredFields = []
	const fields = {}

	collectionFieldsMeta.forEach((field) => {
		const fieldName = field["uesio/core.name"]
		const fieldNamespace = field["uesio/core.namespace"]
		const fieldFullName = fieldNamespace + "." + fieldName
		const fieldType = field["uesio/core.type"]
		const fieldLabel = field["uesio/core.label"]
		const required = field["uesio/core.required"]
		if (fieldType === "TEXT") {
			fields[fieldFullName] = {
				type: "string",
				description: `
					This field's label is ${fieldLabel}.
				`,
			}
			if (required) {
				requiredFields.push(fieldName)
			}
		}
		if (fieldType === "NUMBER") {
			fields[fieldFullName] = {
				type: "number",
				description: `
					This field's label is ${fieldLabel}.
				`,
			}
			if (required) {
				requiredFields.push(fieldName)
			}
		}
		if (fieldType === "CHECKBOX") {
			fields[fieldFullName] = {
				type: "boolean",
				description: `
					This field's label is ${fieldLabel}.
				`,
			}
			if (required) {
				requiredFields.push(fieldName)
			}
		}
	})

	const createRecordsTool = {
		name: "create_sample_data",
		description: "Create sample data records",
		input_schema: {
			type: "object",
			properties: {
				records: {
					type: "array",
					description: "The records to create",
					items: {
						type: "object",
						properties: fields,
						required: requiredFields,
					},
				},
			},
			required: ["records"],
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
			tools: [createRecordsTool],
			tool_choice: {
				type: "tool",
				name: createRecordsTool.name,
			},
		}
	)

	if (!result.length) {
		throw new Error("Invalid Result")
	}

	const records = result[0].input.records

	bot.log.info("Records", records)

	bot.save(collection, records)
}
