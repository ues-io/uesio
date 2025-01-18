import { RunActionBotApi } from "@uesio/bots"

export default function add_numbers(bot: RunActionBotApi) {
  const { a = 0, b = 0 } = bot.params.getAll()
  const result = bot.callBot("add_numbers", {
    a,
    b,
  })
  bot.addResult("sum", result.answer)
}
