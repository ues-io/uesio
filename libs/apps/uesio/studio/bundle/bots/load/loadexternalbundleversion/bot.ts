import { LoadBotApi } from "@uesio/bots"

type ApiResponse = {
	version: string
	description: string
}

export default function loadexternalbundleversion(bot: LoadBotApi) {
	const { conditions } = bot.loadRequest

	const bundleStoreDomain = bot.getConfigValue(
		"uesio/core.bundle_store_domain"
	)

	const externalBundleVersionUniquekey = conditions?.find(
		(condition) => condition.id === "externalBundleVersionUniquekey"
	)

	if (!externalBundleVersionUniquekey?.value) {
		bot.addError("Missing Uniquekey")
		return
	}

	const url =
		"https://studio." +
		bundleStoreDomain +
		"/site/bundles/v1/versions/" +
		externalBundleVersionUniquekey.value +
		"/list"

	const response = bot.http.request({
		method: "GET",
		url,
	})
	const apiResponse = response.body as unknown as ApiResponse[]
	apiResponse.forEach((record) =>
		bot.addRecord({
			"uesio/studio.version": record.version,
			"uesio/studio.description": record.description,
		})
	)
}
