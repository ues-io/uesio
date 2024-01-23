import { LoadBotApi } from "@uesio/bots"

type ApiResponse = {
	app: string
	description: string
	icon: string
	color: string
}

export default function loadbundlelisting(bot: LoadBotApi) {
	const { conditions } = bot.loadRequest

	const localBundleOnlyCondition = conditions?.find(
		(condition) => condition.id === "localBundleOnly"
	)

	if (
		localBundleOnlyCondition &&
		localBundleOnlyCondition.inactive === false
	) {
		//LOCAL Bundels (shall we filter by approved & PUBLISHED ??)
		const results = bot.load({
			collection: `uesio/studio.bundlelisting`,
			fields: [
				{
					id: "uesio/studio.app",
					fields: [
						{ id: "uesio/studio.fullname" },
						{ id: "uesio/studio.color" },
						{ id: "uesio/studio.icon" },
					],
				},
				{ id: "uesio/studio.description" },
				{ id: "uesio/studio.approved" },
			],
		})

		results.map((fieldValue, index) => {
			bot.addRecord({
				...(fieldValue as Object),
				"uesio/studio.localbundle": true,
			})
		})
	} else {
		const bundleStoreDomain = bot.getConfigValue(
			"uesio/core.bundle_store_domain"
		)
		const url =
			"https://studio." + bundleStoreDomain + "/site/bundles/v1/list"

		const response = bot.http.request({
			method: "GET",
			url,
		})

		const apiResponse = response.body as unknown as ApiResponse[]
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
}
