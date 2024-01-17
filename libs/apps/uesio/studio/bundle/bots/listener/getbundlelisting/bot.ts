import { ListenerBotApi } from "@uesio/bots"

export default function getbundlelisting(bot: ListenerBotApi) {
	const bundlelisting = bot.load({
		collection: `uesio/studio.bundlelisting`,
		fields: [
			{
				id: "uesio/studio.app",
				fields: [
					{ id: "uesio/studio.fullname" },
					{ id: "uesio/studio.color" },
					{ id: "uesio/studio.icon" },
				],
			},
			{ id: "uesio/studio.description" },
			{ id: "uesio/studio.approved" },
		],
	})

	bundlelisting.map((field, index) => {
		bot.addResult("Record_" + index.toString(), field)
	})
}
