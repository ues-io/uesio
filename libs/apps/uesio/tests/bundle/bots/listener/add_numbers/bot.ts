import { ListenerBotApi } from "@uesio/bots"
import { Params } from "@uesio/app/bots/listener/uesio/tests/add_numbers"

export default function add_numbers(bot: ListenerBotApi) {
  const params = bot.params.getAll() as Params
  const { a, b, c = 0 } = params
  // bot.log.info("inputs: a=" + a + ", b=" + b + ", c=" + c)
  bot.addResult("answer", a + b + c)
  bot.addResult(
    "dynamicAnswer",
    Object.values(params).reduce(
      (acc: number, val: number) => acc + (val ?? 0),
      0,
    ),
  )
}
