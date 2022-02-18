import type { bot } from "@uesio/ui"

function onchange(bot: bot.BeforeSaveBot) {
	const request: bot.LoadRequest = {
		collection: "crm.accounts",
		fields: [{ id: "uesio.id" }, { id: "crm.email" }, { id: "crm.name" }],
		order: [{ field: "crm.email", desc: true }],
		conditions: [
			{
				field: "crm.email",
				value: "peachffff@gmail.com",
			},
		],
	}

	try {
		const data = bot.load(request)
		console.log(data && data[0] && data[0]["crm.email"])
	} catch (error) {
		console.log(error)
	}
}
