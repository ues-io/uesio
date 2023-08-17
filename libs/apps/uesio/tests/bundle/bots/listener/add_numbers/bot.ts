import { ListenerBotApi } from "@uesio/bots"
function add_numbers(bot: ListenerBotApi) {
	const a = (bot.params.get("a") as number) || 0
	const b = (bot.params.get("b") as number) || 0
	const c = (bot.params.get("c") as number) || 0
	bot.log.info("inputs: a=" + a + ", b=" + b + ", c=" + c)
	bot.addResult("answer", a + b + c)
}
