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

	const doDataModel = bot.params.get("use_ai_for_data_model")
	if (doDataModel && doDataModel !== "false") {
		bot.runGenerator("uesio/appkit", "collections", {
			instructions: bot.params.get("data_model_instructions"),
		})
	}
}
