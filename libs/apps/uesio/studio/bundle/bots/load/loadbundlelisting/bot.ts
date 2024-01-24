import { LoadBotApi } from "@uesio/bots"

type ApiResponse = {
	app: string
	description: string
	icon: string
	color: string
}

export default function loadbundlelisting(bot: LoadBotApi) {
	const { conditions } = bot.loadRequest

	const bundleStoreDomain = bot.getConfigValue(
		"uesio/core.bundle_store_domain"
	)
	const url = "https://studio." + bundleStoreDomain + "/site/bundles/v1/list"

	const response = bot.http.request({
		method: "GET",
		url,
	})

	let apiResponse = response.body as unknown as ApiResponse[]

	const bundleListingWrapperUniquekey = conditions?.find(
		(condition) => condition.id === "bundleListingWrapperUniquekey"
	)

	if (bundleListingWrapperUniquekey) {
		apiResponse = apiResponse.filter(
			(record) => record.app === bundleListingWrapperUniquekey.value
		)
	}

	apiResponse.forEach((record) =>
		bot.addRecord({
			"uesio/studio.uniquekey": record.app,
			"uesio/studio.description": record.description,
			"uesio/studio.approved": true,
			"uesio/studio.app": {
				"uesio/core.uniquekey": record.app,
				"uesio/studio.color": record.color,
				"uesio/studio.icon": record.icon,
				"uesio/studio.fullname": record.app,
			},
		})
	)
}
