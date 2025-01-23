import { LoadBotApi } from "@uesio/bots"

export default function ${name}(bot: LoadBotApi) {
  const { collection, fields, conditions, order, batchSize, batchNumber, collectionMetadata } = bot.loadRequest
  const results = [
    {
      "first_name": "Luigi",
      "last_name": "Vampa"
    },
    {
      "first_name": "Myasia",
      "last_name": "Harvey"
    },
  ]
  results.forEach((record) => bot.addRecord(record))
}
