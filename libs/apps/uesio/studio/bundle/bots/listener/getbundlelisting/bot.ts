import { ListenerBotApi } from "@uesio/bots"

export default function getbundlelisting(bot: ListenerBotApi) {
	const bundlelisting = bot.load({
		collection: `uesio/studio.bundlelisting`,
	})
}
