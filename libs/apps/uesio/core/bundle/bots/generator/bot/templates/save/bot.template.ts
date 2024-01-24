import { SaveBotApi } from "@uesio/bots"

export default function ${name}(bot: SaveBotApi) {
	const { collection, collectionMetadata, upsert } = bot.saveRequest
	bot.deletes.get().forEach((deleteApi) => {
		bot.log.info("got a record to delete, with id: " + deleteApi.getId())
	})
	bot.inserts.get().forEach((insertApi) => {
		bot.log.info("got a record to insert, with id: " + insertApi.getId())
	})
	bot.updates.get().forEach((updateApi) => {
		bot.log.info("got a record to update, with id: " + updateApi.getId())
	})
}