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
	error?: string
	params?: Record<string, unknown>
}

export default function load_weather_forecast(bot: LoadBotApi) {
	const { conditions } = bot.loadRequest

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
		bot.addError("Failed to get weather forecast: " + botResult.error)
		return
	}

	const { current, forecast } = botResult.params as TempResult

	// TBD: Not used yet in tests, but once we have support for List filtering,
	// use this to filter the forecast list.
	const forecastFilter = (item: WeatherInfo) => {
		if (!conditions || !conditions.length) return true
		return conditions.every((condition) => {
			const { field, value, operator } = condition
			const fieldParts = field.split(".")
			const localField = fieldParts[1] as keyof WeatherInfo
			const itemValue = item[localField]
			switch (localField) {
				case "low":
				case "high":
				case "avg":
					const numericValue =
						(typeof value === "string"
							? parseFloat(value)
							: value) || 0
					if (operator === "GT") {
						return itemValue > numericValue
					} else if (operator === "LT") {
						return itemValue < numericValue
					} else if (operator === "GTE") {
						return itemValue >= numericValue
					} else if (operator === "LTE") {
						return itemValue <= numericValue
					} else if (operator === "EQ") {
						return itemValue === numericValue
					} else if (operator === "NOT_EQ") {
						return itemValue === numericValue
					}
					break
				case "day":
					if (operator === "EQ") {
						return itemValue === value
					} else if (operator === "NOT_EQ") {
						return itemValue !== value
					}
					break
			}
			return true
		})
	}

	bot.addRecord({
		"uesio/tests.current": current,
		"uesio/tests.forecast": forecast.filter(forecastFilter),
	})
}
