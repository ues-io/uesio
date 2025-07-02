function run(bot) {
  const appInfo = bot.getApp()
  const appFullName = bot.getAppName()
  const appDescription = appInfo.getDescription()
  const appName = appInfo.getName()
  const instructions = bot.params.get("instructions")
  let numberToCreate = bot.params.get("number_of_collections") || 5

  if (numberToCreate > 5) {
    numberToCreate = 5
  }

  const existingCollections = bot
    .load({
      collection: "uesio/core.collection",
      conditions: [
        {
          field: "uesio/studio.namespace",
          value: appFullName,
        },
      ],
    })
    .map((record) => record["uesio/core.uniquekey"])

  const existingCollectionsShort = existingCollections
    .map((existing) => existing.split(".").pop())
    .concat("user")

  const validIcons = [
    "circle",
    "change_history",
    "square",
    "pentagon",
    "hexagon",
    "favorite",
    "shield",
    "cloud",
    "star",
    "science",
    "work",
    "key",
    "eco",
    "bolt",
    "database",
    "spa",
    "water_drop",
    "person",
    "psychology",
    "pets",
    "health_and_safety",
    "recycling",
    "coronavirus",
    "bug_report",
    "gesture",
    "palette",
    "shopping_cart",
    "monitoring",
    "insights",
    "payments",
    "restaurant",
    "music_note",
    "local_shipping",
    "savings",
    "support_agent",
    "rocket_launch",
    "diamond",
    "forest",
    "cookie",
    "skull",
    "prescriptions",
    "barefoot",
    "playing_cards",
    "microbiology",
    "mist",
    "label",
    "fingerprint",
    "cardiology",
    "extension",
    "support",
    "interests",
    "code_blocks",
    "chat",
    "hub",
    "timer",
    "storefront",
    "factory",
    "warehouse",
    "traffic",
    "sailing",
    "school",
    "construction",
    "sports_soccer",
    "piano",
    "camping",
    "lunch_dining",
    "icecream",
    "travel",
    "coffee",
    "self_care",
    "skillet",
    "grocery",
  ]

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

  const existingCollectionsPrompt = `
		The following tables already exist in the database:
		${existingCollectionsShort.join("\n")}

		Create new tables that will compliment the functionality of the existing ones.
		Do not create duplicates.
	`

  const prompt = `
		Use the tool provided to create up to ${numberToCreate} tables for this app called: "${appName}"
		with a description of: "${appDescription}". These table names will form the basis of the
		data model for this app. For icons, do not use the same icon more than once.

		${existingCollectionsPrompt}

		${additional}
	`

  const nameParam = {
    type: "string",
    description: `
			The table name. These should be singular and all lowercase. It may not contain
			any special characters or spaces, except for an underscore. If two words are needed
			for this table name, then it should be in snake case.
		`,
  }

  const labelParam = {
    type: "string",
    description: `
			A human readable label for this table. It should start with a
			capital letter and spaces are allowed. It should still be singular.
		`,
  }

  const iconParam = {
    type: "string",
    description: `
			An icon descriptor for this table. This should be one of the google material symbols icon names.
			Only use icons from the list below.
			${validIcons.join("\n")}
		`,
  }

  const pluralLabelParam = {
    type: "string",
    description: `
			The plural version of the label.
		`,
  }

  const createTablesTool = {
    name: "create_tables",
    description: "Create database tables",
    input_schema: {
      type: "object",
      properties: {
        tables: {
          type: "array",
          description: "The tables to create",
          items: {
            type: "object",
            properties: {
              name: nameParam,
              label: labelParam,
              pluralLabel: pluralLabelParam,
              icon: iconParam,
            },
            required: ["name"],
          },
        },
      },
      required: ["tables"],
    },
  }

  const result = bot.runIntegrationAction(
    "uesio/aikit.bedrock",
    "invokemodel",
    {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system: systemPrompt,
      tools: [createTablesTool],
      tool_choice: {
        type: "tool",
        name: createTablesTool.name,
      },
    },
  )

  if (!result.length) {
    throw new Error("Invalid Result")
  }

  //bot.log.info("ai result", result)
  const additionalCollections = result[0].input.tables.map(
    (collection) => collection.name,
  )

  bot.runGenerators(
    result[0].input.tables.map((collection) => ({
      namespace: "uesio/appkit",
      name: "collection",
      params: {
        collection: collection.name,
        label: collection.label,
        pluralLabel: collection.pluralLabel,
        icon: collection.icon,
        additionalCollections,
      },
    })),
  )
}
