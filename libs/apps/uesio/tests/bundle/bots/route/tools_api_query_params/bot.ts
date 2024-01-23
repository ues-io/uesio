import { LoadRequest, RouteBotApi } from "@uesio/bots"
import { Params } from "@uesio/app/bots/route/uesio/tests/tools_api_query_params"

export default function tools_api_query_params(bot: RouteBotApi) {
	const params = bot.params.getAll() as Params
	const ns = bot.getNamespace()
	const { brand_name, category, type, limit } = params
	const loadRequest = {
		collection: `${ns}.tool`,
		fields: [
			{ id: `${ns}.category` },
			{ id: `${ns}.brand` },
			{ id: `${ns}.type` },
		],
		conditions: [],
	} as LoadRequest
	if (typeof limit === "number") {
		loadRequest.batchsize = limit
	}
	if (category) {
		loadRequest.conditions?.push({
			field: `${ns}.category`,
			operator: "EQ",
			value: category,
		})
	}
	if (brand_name) {
		loadRequest.conditions?.push({
			field: `${ns}.brand`,
			operator: "EQ",
			value: brand_name,
		})
	}
	if (type) {
		loadRequest.conditions?.push({
			field: `${ns}.type`,
			operator: "EQ",
			value: type,
		})
	}
	const results = bot.load(loadRequest)
	if (!results.length) {
		bot.response.setStatusCode(404)
		return
	}
	bot.response.setBody(
		results.map((result) => ({
			brand: result[`${ns}.brand`],
			category: result[`${ns}.category`],
			type: result[`${ns}.type`],
		})),
		"application/json"
	)
}
