import { ListenerBotApi } from "@uesio/bots"

// @ts-ignore
function get_weather_forecast(bot: ListenerBotApi) {
	const now = new Date()

	type WeatherInfo = {
		day: string
		low: number
		high: number
		avg: number
	}

	const randomTemp = (baseline: number, maxVariation: number) =>
		Math.round(baseline + maxVariation * Math.random())

	const makeRandomDailyForecast = (date: Date): WeatherInfo => ({
		day: date.toISOString(),
		low: randomTemp(25, 5),
		high: randomTemp(35, 5),
		avg: randomTemp(30, 5),
	})

	const addDays = (date: Date, days: number) => {
		const d = new Date(date.getTime())
		d.setDate(d.getDate() + days)
		return d
	}
	bot.addResult("current", makeRandomDailyForecast(now))
	bot.addResult("forecast", [
		makeRandomDailyForecast(addDays(now, 1)),
		makeRandomDailyForecast(addDays(now, 2)),
		makeRandomDailyForecast(addDays(now, 2)),
		makeRandomDailyForecast(addDays(now, 3)),
		makeRandomDailyForecast(addDays(now, 4)),
		makeRandomDailyForecast(addDays(now, 5)),
		makeRandomDailyForecast(addDays(now, 6)),
	] as WeatherInfo[])
	bot.log.info("Weather forecast sent")
}
