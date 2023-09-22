import { ListenerBotApi } from "@uesio/bots"

type CallBotResponse = {
	error?: string
	params?: Record<string, unknown>
	success: boolean
}

// @ts-ignore
function call_web_integration(bot: ListenerBotApi) {
	const a = (bot.params.get("a") as number) || 0
	const b = (bot.params.get("b") as number) || 0
	bot.log.info("inputs: a=" + a + ", b=" + b)
	// Call the studio call bot API
	const result = bot.runIntegrationAction("uesio/tests.studio_apis", "post", {
		url: "/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers",
		body: JSON.stringify({
			a,
			b,
		}),
		headers: {
			"Content-Type": "application/json",
			Cookie: "sessid=" + bot.getSession().getId(),
		},
	}) as CallBotResponse
	bot.log.info("result was success? [inline]: " + result.success)
	bot.log.info("result was success? [auto]", result.success)
	bot.addResult("answer", result?.params?.answer || "")
}
