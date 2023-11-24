import { AfterSaveBotApi } from "@uesio/bots"
//decrease the population in 6
function decrease_population(bot: AfterSaveBotApi) {
	bot.inserts.get().forEach(function (change) {
		const a = 2
		const b = 4
		const c = 0
		const result = bot.callBot("add_numbers", { a, b, c })
		const currentPopulation = change.get(
			"uesio/tests.total_population"
		) as number
		change.set(
			"uesio/tests.total_population",
			currentPopulation - result.answer
		)
	})
}
