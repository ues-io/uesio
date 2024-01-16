import { LoadBotApi } from "@uesio/bots"

export default function loadbundlelisting(bot: LoadBotApi) {
	const bundleStoreDomain = bot.getConfigValue(
		"uesio/core.bundle_store_domain"
	)

	bot.log.info("bundleStoreDomain --> ", bundleStoreDomain)

	const {
		collection,
		fields,
		conditions,
		order,
		batchSize,
		batchNumber,
		collectionMetadata,
	} = bot.loadRequest

	bot.log.info(
		"TEST --> ",
		collection,
		fields,
		conditions,
		order,
		batchSize,
		batchNumber,
		collectionMetadata
	)

	const results = [
		{
			"uesio/studio.description": "Luigi",
			"uesio/studio.approved": true,
		},
		{
			"uesio/studio.description": "DOS",
			"uesio/studio.approved": true,
		},
	]
	results.forEach((record) => bot.addRecord(record))

	// const url =
	// 	"https://studio." +
	// 	bundleStoreDomain +
	// 	"/site/bundles/v1/versions/uesio/crm/list"

	// const response = bot.http.request({
	// 	method: "GET",
	// 	url,
	// })
	// bot.log.info("Got Data", JSON.stringify(response.body))
}
