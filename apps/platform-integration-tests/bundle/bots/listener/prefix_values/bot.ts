import { ListenerBotApi } from "@uesio/bots"

export default function prefix_values(bot: ListenerBotApi) {
  const prefix = (bot.params.get("prefix") as string) || ""
  const values = (bot.params.get("values") as string[]) || []
  bot.addResult(
    "values",
    values.map((value) => prefix + value),
  )
}
