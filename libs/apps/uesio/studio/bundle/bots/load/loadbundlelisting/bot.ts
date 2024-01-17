import { LoadBotApi } from "@uesio/bots"

export default function loadbundlelisting(bot: LoadBotApi) {
	const bundleStoreDomain =
		bot.getConfigValue("uesio/core.bundle_store_domain") ||
		"uesio-dev.com:3000"

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
	bot.log.info("Got Data", JSON.stringify(response.body))
}
