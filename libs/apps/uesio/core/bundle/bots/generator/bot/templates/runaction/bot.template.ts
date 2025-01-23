import { RunActionBotApi } from "@uesio/bots"
import { Params } from "@uesio/app/bots/runaction/${app}/${name}"

type OrderDetails = {
  orderNumber: string
}

export default function ${name}(bot: RunActionBotApi) {
  const params = bot.params.getAll() as Params
  const { amount, itemNumbers } = params
  const actionName = bot.getActionName()

  if (actionName !== "createOrder") {
    bot.addError("unsupported action name: " + actionName)
    return
  }

  // Call API to create order
  const result = bot.http.request({
    method: "POST",
    url: bot.getIntegration().getBaseURL() + "/api/v1/orders",
    body: {
      lineItems: itemNumbers,
      amount: amount,
    },
  })
  if (result.code !== 200) {
    bot.addError("could not place order: " + result.status)
    return
  }
  const orderDetails = result.body as OrderDetails
  const { orderNumber } = orderDetails

  bot.addResult("orderNumber", orderNumber)
}
