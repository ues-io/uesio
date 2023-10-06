import { RunActionBotApi } from "@uesio/bots"

type WeatherInfo = {
	day: string
	low: number
	high: number
	avg: number
}

type TempResult = {
	current: WeatherInfo
	forecast: WeatherInfo[]
}

type BotResult = {
	success: boolean
	error?: string
	params?: Record<string, unknown>
}

export default function get_weather_forecast(bot: RunActionBotApi) {
	const siteBaseUrl = bot.getConfigValue("uesio/tests.studio_apis_url")
	bot.log.info("site base url: " + siteBaseUrl)
	if (!siteBaseUrl) {
		bot.addError(
			"Studio APIs URL Config Value must be set in order to call Studio APIs."
		)
		return
	}
	const headers = {
		"Content-Type": "application/json",
		Cookie: "sessid=" + bot.getSession().getId(),
	} as Record<string, string>
	const result = bot.http.request({
		method: "POST",
		url: `${siteBaseUrl}/bots/call/uesio/tests/get_weather_forecast`,
		body: {},
		headers,
	})

	if (result.code !== 200) {
		bot.addError(
			"Failed to get weather forecast: " +
				result.status +
				", result: " +
				JSON.stringify(result.body)
		)
		return
	}

	const botResult = result.body as BotResult

	if (botResult.success === false) {
		bot.addError("Failed to get weather forecast: " + botResult.error)
		return
	}

	const { current, forecast } = botResult.params as TempResult

	bot.addResult("current", current)
	bot.addResult("forecast", forecast)
}
