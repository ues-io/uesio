function starter(bot) {
	// Create a nav view
	bot.runGenerator("uesio/appkit", "view_leftnav", {})

	// Create a home view/route
	bot.runGenerator("uesio/appkit", "view_home", {})

	// Create a settings view/route
	bot.runGenerator("uesio/appkit", "view_settings", {})

	// Create a users view/route
	bot.runGenerator("uesio/appkit", "view_users", {})

	// Create a login view/route
	bot.runGenerator("uesio/appkit", "view_login", {})

	// Create admin profile/permission set
	bot.runGenerator("uesio/appkit", "profile_admin", {})

	// Create public profile/permission set
	bot.runGenerator("uesio/appkit", "profile_public", {})

	// Create a signup method
	// Create public profile/permission set
	bot.runGenerator("uesio/appkit", "signupmethod_admin", {})

	// Set up the bundledef and other dependencies
	bot.runGenerator("uesio/appkit", "starter_bundledef", {})

	if (bot.params.get("use_ai_for_data_model")) {
		const appInfo = bot.getApp()
		const appName = bot.getAppName()
		const description = appInfo.description
		const result = bot.runIntegrationAction(
			"uesio/aikit.bedrock",
			"invokemodel",
			{
				model: "anthropic.claude-3-haiku-20240307-v1:0",
				messages: [
					{
						role: "user",
						content: `Please use the tool provided to create 3 or fewer primary tables for this app called: ${appName} with a description of : ${description}. This name should be the primary types of that would be tracked in this app. There is already a table called "user", so there is no need to create that table.`,
					},
				],
				system: "You are an assistant who creates data models for databases. You think deeply about the correct names for the objects and fields for long-term maintainability and readability.",
				tools: [
					{
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
											name: {
												type: "string",
												description:
													"The table name. These should be singular and all lowercase",
											},
											label: {
												type: "string",
												description:
													"A human readable label for this table. It should start with a capital letter and spaces are allowed. It should still be singular.",
											},
											pluralLabel: {
												type: "string",
												description:
													"This should be the plural version of the label.",
											},
										},
										required: ["name"],
									},
								},
							},
							required: ["tables"],
						},
					},
				],
				tool_choice: {
					type: "tool",
					name: "create_tables",
				},
			}
		)

		if (!result.length) {
			throw new Error("Invalid Result")
		}

		//bot.log.info("ai result", result)

		const collections = result[0].input.tables

		collections.forEach((collection) => {
			bot.runGenerator("uesio/appkit", "collection", {
				collection: collection.name,
				label: collection.label,
				pluralLabel: collection.pluralLabel,
			})
		})
	}
}
