function starter(bot) {
	bot.runGenerators([
		{
			// Create a nav view
			namespace: "uesio/appkit",
			name: "view_leftnav",
			params: {},
		},
		{
			// Create a home view/route
			namespace: "uesio/appkit",
			name: "view_home",
			params: {},
		},
		{
			// Create a settings view/route
			namespace: "uesio/appkit",
			name: "view_settings",
			params: {},
		},
		{
			// Create a users view/route
			namespace: "uesio/appkit",
			name: "view_users",
			params: {},
		},
		{
			// Create a login view/route
			namespace: "uesio/appkit",
			name: "view_login",
			params: {},
		},
		{
			// Create admin profile/permission set
			namespace: "uesio/appkit",
			name: "profile_admin",
			params: {},
		},
		{
			// Create public profile/permission set
			namespace: "uesio/appkit",
			name: "profile_public",
			params: {},
		},
		{
			// Create a signup method
			namespace: "uesio/appkit",
			name: "signupmethod_admin",
			params: {},
		},
		{
			// Set up the bundledef and other dependencies
			namespace: "uesio/appkit",
			name: "starter_bundledef",
			params: {},
		},
	])

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
						content: `Please use the tool provided to create up to 5 tables for this app called: ${appName} with a description of : ${description}. This name should be the primary types of that would be tracked in this app. There is already a table called "user", so there is no need to create that table.`,
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

		bot.runGenerators(
			result[0].input.tables.map((collection) => ({
				namespace: "uesio/appkit",
				name: "collection",
				params: {
					collection: collection.name,
					label: collection.label,
					pluralLabel: collection.pluralLabel,
				},
			}))
		)
	}
}
