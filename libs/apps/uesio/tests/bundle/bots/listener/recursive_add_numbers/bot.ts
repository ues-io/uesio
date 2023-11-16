import { ListenerBotApi } from "@uesio/bots"

export default function recursive_add_numbers(bot: ListenerBotApi) {
	const a = (bot.params.get("a") as number) || 0
	const b = (bot.params.get("b") as number) || 0
	const c = (bot.params.get("c") as number) || 0
	bot.log.info("inputs: a=" + a + ", b=" + b + ", c=" + c)
	const result = bot.callBot("add_numbers", { a, b, c })
	const namespacedCall = bot.callBot("uesio/tests.add_numbers", { a, b, c })
	bot.addResult("answer", result.answer)
	bot.addResult("namespacedAnswer", namespacedCall.answer)
}
