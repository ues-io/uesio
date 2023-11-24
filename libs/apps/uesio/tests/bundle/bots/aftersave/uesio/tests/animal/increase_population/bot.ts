import { AfterSaveBotApi } from "@uesio/bots"
//increase the population in 10
export default function increase_population(bot: AfterSaveBotApi) {
	bot.inserts.get().forEach((change) => {
		const a = 2
		const b = 4
		const c = 4
		const result = bot.callBot("add_numbers", { a, b, c })
		const currentPopulation = (change.get("uesio/tests.total_population") ||
			0) as number
		change.set(
			"uesio/tests.total_population",
			currentPopulation + (result.answer as number)
		)
	})
}
