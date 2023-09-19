import { LoadBotApi } from "@uesio/bots"

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
	params?: Record<string, unknown>
}

// @ts-ignore
function load_weather_forecast(bot: LoadBotApi) {
	const result = bot.http.request({
		method: "POST",
		url: `${bot
			.getIntegration()
			.getBaseURL()}/workspace/uesio/tests/dev/bots/call/uesio/tests/get_weather_forecast`,
		body: {},
		headers: {
			"Content-Type": "application/json",
			Cookie: "sessid=" + bot.getSession().getId(),
		},
	})

	if (result.code !== 200) {
		bot.addError("Failed to get weather forecast: " + result.status)
		return
	}

	const botResult = result.body as BotResult

	if (botResult.success === false) {
		bot.addError("Failed to get weather forecast")
		return
	}

	const { current, forecast } = botResult.params as TempResult

	bot.addRecord({
		"uesio/tests.current": current,
		"uesio/tests.forecast": forecast,
	})
}
