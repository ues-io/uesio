function starter(bot) {
	bot.runGenerators([
		{
			// Create a viewlayout variant
			namespace: "uesio/sitekit",
			name: "variant_viewlayout_page",
			params: {},
		},
		{
			// Create a header view
			namespace: "uesio/sitekit",
			name: "view_header",
			params: {},
		},
		{
			// Create a footer view
			namespace: "uesio/sitekit",
			name: "view_footer",
			params: {},
		},
		{
			// Create a home view/route
			namespace: "uesio/sitekit",
			name: "view_home",
			params: {},
		},
		{
			// Create public profile/permission set
			namespace: "uesio/sitekit",
			name: "profile_public",
			params: {},
		},
		{
			// Set up the bundledef and other dependencies
			namespace: "uesio/sitekit",
			name: "starter_bundledef",
			params: {},
		},
	])

	const doContentAndCopy = bot.params.get("use_ai_for_content_and_copy")
	if (doContentAndCopy && doContentAndCopy !== "false") {
		/*
		bot.runGenerator("uesio/sitekit", "collections", {
			instructions: bot.params.get("data_model_instructions"),
		})
		*/
	}
}
