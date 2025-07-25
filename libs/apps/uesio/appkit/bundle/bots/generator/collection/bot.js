function run(bot) {
  const collectionName = bot.params.get("collection")
  const collectionLabel = bot.params.get("label")
  const collectionPluralLabel = bot.params.get("pluralLabel")
  const collectionIcon = bot.params.get("icon")
  const additionalCollections = bot.params.get("additionalCollections")
  const instructions = bot.params.get("instructions")

  const namespace = bot.getAppName()

  const fullCollectionName = namespace + "." + collectionName

  const existingCollections = bot
    .load({
      collection: "uesio/core.collection",
      conditions: [
        {
          field: "uesio/studio.namespace",
          value: namespace,
        },
      ],
    })
    .map((record) => record["uesio/core.uniquekey"])

  const existingCollectionsShort = existingCollections
    .map((existing) => existing.split(".").pop())
    .concat("user")
    .concat(...(additionalCollections || []))

  const systemPrompt = `
		You are an assistant who specializes in creating data models for databases.
		You deeply understand relational databases and seek to complete the task in
		the simplest and most straightforward way possible.
	`

  const additional = instructions
    ? `
		The following additional instructions were given:
		${instructions}
	`
    : ""

  const prompt = `
		Use the tool provided to create between 5 and 10 fields for
		a database table called: ${collectionName}. The primary key for this table as well
		as audit fields such as created date, updated date, created by and updated by already
		exist and should not be created again. The other tables that already exist are.
		${existingCollectionsShort.join("\n")}

		${additional}
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

  const isNameFieldParam = {
    type: "boolean",
    description: `
			Only provide a value for this parameter if the field's type is TEXT.
			Set this parameter to "true" if this field could be used as the primary label
			for this record. Usually this is for the field called "Name" or "Label".
			Only set this to true for one of the fields.
		`,
  }

  const referencedCollectionParam = {
    type: "string",
    description: `
			Only provide a value for this parameter if the field's type is REFERENCE.
			If it is reference, chose the table that this field is a foreign key
			reference to from one of the following tables. And use that table's name
			as the value for this parameter.
			${existingCollectionsShort.join("\n")}
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
              isNameField: isNameFieldParam,
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
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      system: systemPrompt,
      tools: [createFieldsTool],
      tool_choice: {
        type: "tool",
        name: createFieldsTool.name,
      },
    },
  )

  if (!result.length) {
    throw new Error("Invalid Result")
  }

  //bot.log.info("ai result", result)

  const fields = result[0].input.fields

  const validMeta = /^\w+$/

  // Validate the fields
  const validFields = fields.flatMap((field) => {
    if (!field.name) return undefined
    if (!validMeta.test(field.name)) return undefined
    field.name = field.name.toLowerCase()
    if (field.type === "REFERENCE") {
      if (!field.referencedCollection) {
        field.type = "TEXT"
        return [field]
      }
      if (!existingCollectionsShort.includes(field.referencedCollection)) {
        field.type = "TEXT"
        field.referencedCollection = ""
        return [field]
      }
    }

    return [field]
  })

  const nameField = validFields.find((field) => field.isNameField)

  bot.runGenerator("uesio/core", "collection", {
    name: collectionName,
    label: collectionLabel,
    pluralLabel: collectionPluralLabel,
    icon: collectionIcon,
    nameField: nameField ? nameField.name : "external_id",
  })

  const getRefCollection = (field) => {
    const refCol = field.referencedCollection
    if (refCol === "user") {
      return "uesio/core.user"
    }
    return namespace + "." + refCol
  }

  const fieldIds = validFields.map((field) => {
    bot.runGenerator("uesio/core", "field", {
      collection: fullCollectionName,
      name: field.name,
      label: field.label,
      type: field.type,
      ref_collection: getRefCollection(field),
      accept: field.accept,
    })
    return namespace + "." + field.name
  })

  // Add an autonumber field
  bot.runGenerator("uesio/core", "field", {
    collection: fullCollectionName,
    name: "external_id",
    label: "External ID",
    type: "AUTONUMBER",
    autonumber_prefix: collectionName.substring(0, 3).toUpperCase(),
  })

  bot.runGenerator("uesio/appkit", "views_collection", {
    collection: fullCollectionName,
    fields: fieldIds,
  })
}
