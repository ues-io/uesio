function starter(bot) {
	const appInfo = bot.getApp()
	const appName = appInfo.getName()

	const doContentAndCopy = bot.params.get("use_ai_for_content_and_copy")
	if (doContentAndCopy && doContentAndCopy !== "false") {
		/*
		bot.runGenerators([
			{
				namespace: "uesio/sitekit",
				name: "image",
				params: {
					prompt: `A (minimal:0.5), (artistic:0.6), (wordmark:1) for the app named (${appName}:1). The background is white and the workmark is full frame, edge-to-edge, borderless, full bleed.`,
					filename: "logo",
					aspect_ratio: "21:9",
				},
			},
			{
				namespace: "uesio/sitekit",
				name: "image",
				params: {
					prompt: `Seamless tile, (minimal:0.9), (artistic:0.5) (wallpaper:1) background for the app named (${appName}:1). Simple, small, illustrations. The background is white. The primary color is (orange:0.4).`,
					filename: "background",
					aspect_ratio: "1:1",
				},
			},
		])
			*/
	}

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
}
