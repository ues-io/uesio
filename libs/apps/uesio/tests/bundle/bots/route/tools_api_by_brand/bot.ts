import { RouteBotApi } from "@uesio/bots"
import { Params } from "@uesio/app/bots/route/uesio/tests/tools_api_by_brand"

export default function tools_api_by_brand(bot: RouteBotApi) {
  const params = bot.params.getAll() as Params
  const ns = bot.getNamespace()
  const { brand_name } = params
  // capitalize first to ensure we get a match
  const brandName =
    brand_name.substring(0, 1).toUpperCase() + brand_name.substring(1)
  const results = bot.load({
    collection: `${ns}.tool`,
    fields: [
      { id: `${ns}.category` },
      { id: `${ns}.brand` },
      { id: `${ns}.type` },
    ],
    conditions: [
      {
        field: `${ns}.brand`,
        operator: "EQ",
        value: brandName,
      },
    ],
  })
  if (!results.length) {
    bot.response.setStatusCode(404)
    return
  }
  bot.response.setBody(
    results.map((result) => ({
      category: result[`${ns}.category`],
      type: result[`${ns}.type`],
    })),
    "application/json",
  )
}
