import { LoadBotApi } from "@uesio/bots"

type ApiResponse = {
	app: string
	description: string
	icon: string
	color: string
}

export default function loadbundlelisting(bot: LoadBotApi) {
	const bundleStoreDomain = bot.getConfigValue(
		"uesio/core.bundle_store_domain"
	)

	bot.log.info("bundleStoreDomain --> ", bundleStoreDomain)

	if (bundleStoreDomain != "") {
		//API call
	}

	//READ from DB
	const results = bot.callBot("getbundlelisting", {})

	Object.entries(results).map(([key, fieldValue], index) => {
		bot.addRecord({ ...(fieldValue as Object) })
	})

	const url = "https://studio." + bundleStoreDomain + "/site/bundles/v1/list"

	const response = bot.http.request({
		method: "GET",
		url,
	})

	const apiResponse = response.body as unknown as ApiResponse[]
	bot.log.info("Got Data", apiResponse)
	apiResponse.forEach((record) =>
		bot.addRecord({
			"uesio/studio.uniquekey": record.app,
			"uesio/studio.description": record.description,
			"uesio/studio.approved": true,
		})
	)
}
