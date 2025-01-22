function run(bot) {
  const collection = bot.params.get("collection")
  const instructions = bot.params.get("instructions")

  const collectionFieldsMeta = bot.load({
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
  const user = bot.getUser()
  const appName = appInfo.getName()
  const description = appInfo.getDescription()

  const systemPrompt = `
		You are an assistant who specializes in creating sample data for databases.
		You want to create interesting and playful data for demo purposes, but also data
		that is relevant to the instructions given.
	`

  const additional = instructions
    ? `
		The following additional instructions were given:
		${instructions}
	`
    : ""

  const prompt = `
		Use the tool provided to create 5 records of sample data for an table called: ${collection.split(".").pop()}
		The name of the app that you are creating data for is ${appName},
		with a description of : ${description}.

		${additional}
	`

  const requiredFields = []
  const fields = {}

  const refFields = {}
  const refCollections = {}

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
					Do not use "unknown" here. If you don't have enough information,
					just make up something.
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
    if (fieldType === "DATE") {
      fields[fieldFullName] = {
        type: "string",
        format: "date",
        description: `
					This field's label is ${fieldLabel}.
				`,
      }
      if (required) {
        requiredFields.push(fieldName)
      }
    }
    if (fieldType === "REFERENCE") {
      const refInfo = field["uesio/core.reference"]
      const refCollection = refInfo["uesio/core.collection"]
      refFields[fieldFullName] = refCollection
      if (refCollection === "uesio/core.user") {
        return
      }
      // Don't get sample data for self-references
      if (refCollection === collection) {
        return
      }
      refCollections[refCollection] = []
    }
  })

  //bot.log.info("fields", fields)
  if (!Object.keys(fields).length) {
    return
  }

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
    },
  )

  if (!result.length) {
    throw new Error("Invalid Result")
  }

  const records = result[0].input.records

  // Handle Reference Fields
  Object.keys(refCollections).forEach((refCollection) => {
    let attempts = 0
    // Poll until you find some records to use
    while (attempts < 10) {
      attempts++
      //bot.log.info("attempting ref load", refCollection)
      const refData = bot.load({
        collection: refCollection,
        batchsize: 10,
        fields: [
          {
            id: "uesio/core.id",
          },
        ],
      })

      if (refData && refData.length) {
        refCollections[refCollection] = refData
        break
      }
      bot.sleep(500)
      //bot.log.info("Sleeping", refCollection)
    }
  })

  // Time to add in reference info if we have it.

  if (Object.keys(refFields).length) {
    records.forEach((record) => {
      Object.keys(refFields).forEach((refField) => {
        const refCollection = refFields[refField]
        if (refCollection === "uesio/core.user") {
          // just put in the current user's id
          record[refField] = {
            "uesio/core.id": user.getId(),
          }
          return
        }
        const recordData = refCollections[refCollection]
        if (recordData && recordData.length) {
          const min = 0
          const max = recordData.length
          const random = Math.floor(Math.random() * (max - min) + min)
          record[refField] = recordData[random]
        }
      })
    })
  }

  bot.save(collection, records)
}
