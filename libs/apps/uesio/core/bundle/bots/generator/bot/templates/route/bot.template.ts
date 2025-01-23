import { RouteBotApi } from "@uesio/bots"
import { Params } from "@uesio/app/bots/route/${app}/${name}"

export default function ${name}(bot: RouteBotApi) {
  const params = bot.params.getAll() as Params
  const ns = bot.getNamespace()
  const results = bot.load({
    batchsize: 1,
    collection: `${ns}.promotion`,
    fields: [
      { "id": `${ns}.offer_expires` },
      { "id": `${ns}.offer_amount` }
    ],
    conditions: [
      { "field": `${ns}.name`, "operator": "EQ", "value": params.promotion_name }
    ]
  })
  if (!results.length) {
    bot.response.setStatusCode(404)
    return
  }
  const result = results[0]
  bot.response.setBody({
    expires: result[`${ns}.offer_expires`],
    amount: result[`${ns}.offer_amount`]
  })
  bot.response.setHeader("Content-Type", "application/json")
}
