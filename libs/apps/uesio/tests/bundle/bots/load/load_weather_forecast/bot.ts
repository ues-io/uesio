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

// @ts-ignore
function load_weather_forecast(bot: LoadBotApi) {
	const result = bot.http.request({
		method: "GET",
		url: `${bot
			.getIntegration()
			.getBaseURL()}/workspace/uesio/tests/dev/bots/call/uesio/tests/get_weather_forecast`,
		headers: {
			Cookie: "sessid=" + bot.getSession().getId(),
		},
	})

	const { current, forecast } = result.body as TempResult

	bot.setData([
		{
			"uesio/tests.current": current,
			"uesio/tests.forecast": forecast,
		},
	])
}
