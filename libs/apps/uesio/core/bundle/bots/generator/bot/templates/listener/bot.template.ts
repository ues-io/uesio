import { ListenerBotApi } from "@uesio/bots"
import { Params } from "@uesio/app/bots/listener/${app}/${name}"

export default function ${name}(bot: ListenerBotApi) {
    const params = bot.params.getAll() as Params
    const { a, b } = params
    bot.log.info("input params", params)
    bot.addResult("answer", a + b)
}