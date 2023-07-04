import { AfterSaveBotApi } from "@uesio/bots"
function nozebras(bot: AfterSaveBotApi) {
	bot.inserts.get().forEach(function (change) {
		const species = change.get("uesio/tests.species") as string
		if (species === "Zebra") {
			bot.addError("No Zebras Allowed!")
		}
	})
}
