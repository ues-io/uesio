import { BeforeSaveBotApi } from "@uesio/bots"
//decrease the population in 6
export default function decrease_population(bot: BeforeSaveBotApi) {
  bot.inserts.get().forEach((change) => {
    const a = 2
    const b = 4
    const c = 0
    const result = bot.callBot("add_numbers", { a, b, c })
    const currentPopulation = (change.get("uesio/tests.total_population") ||
      0) as number
    change.set(
      "uesio/tests.total_population",
      currentPopulation - (result.answer as number),
    )
  })
}
