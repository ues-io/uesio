import { ListenerBotApi } from "@uesio/bots"

export default function suggestfields(bot: ListenerBotApi) {
	/*
	const result = bot.runIntegrationAction(
		"uesio/core.openai",
		"autocomplete",
		{
			input: bot.params.get("prompt"),
			model: "gpt-3.5-turbo",
			format: "chat",
		}
	) as string[]
	*/
	const result = bot.runIntegrationAction(
		"uesio/core.bedrock",
		"invokemodel",
		{
			input: bot.params.get("prompt"),
			model: "anthropic.claude-v2",
		}
	) as string[]

	if (!result.length) {
		throw new Error("invalid response for suggesting fields")
	}
	bot.addResult("data", result[0])
}
