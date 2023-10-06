import { ListenerBotApi } from "@uesio/bots"

export default function call_custom_run_action(bot: ListenerBotApi) {
	const lat = (bot.params.get("latitude") as number) || 0
	const lng = (bot.params.get("longitude") as number) || 0
	bot.log.info("inputs: lat=" + lat + ", lng=" + lng)
	const result = bot.runIntegrationAction(
		"uesio/tests.weather_api",
		"get_forecast",
		{
			latitude: lat,
			longitude: lng,
		}
	) as Record<string, string>
	bot.log.info("got a result", result)
	bot.addResult("current", result.current)
	bot.addResult("forecast", result.forecast)
}
