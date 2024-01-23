import { AfterSaveBotApi } from "@uesio/bots"

export default function ${name}(bot: AfterSaveBotApi) {
	bot.inserts.get().forEach(function (change) {
		const recordId = change.get("uesio/core.id");
	});
	bot.deletes.get().forEach(function (change) {
		const recordId = change.getOld("uesio/core.id")
	});
}