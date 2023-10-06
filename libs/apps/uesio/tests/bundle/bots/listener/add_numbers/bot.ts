import { ListenerBotApi } from "@uesio/bots"

export default function add_numbers(bot: ListenerBotApi) {
	const a = (bot.params.get("a") as number) || 0
	const b = (bot.params.get("b") as number) || 0
	const c = (bot.params.get("c") as number) || 0
	bot.log.info("inputs: a=" + a + ", b=" + b + ", c=" + c)
	bot.addResult("answer", a + b + c)
	bot.addResult(
		"dynamicAnswer",
		(Object.values(bot.params.getAll()) as number[]).reduce(
			(acc: number, val: number) => acc + (val ?? 0),
			0
		)
	)
}
