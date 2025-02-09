import { SaveBotApi } from "@uesio/bots"

type TempResult = {
  current: WeatherInfo
  forecast: WeatherInfo[]
}

type WeatherInfo = {
  day: string
  low: number
  high: number
  avg: number
}

type BotResult = {
  success: boolean
  error?: string
  params?: Record<string, unknown>
}

export default function save_weather_forecast(bot: SaveBotApi) {
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
    bot.addError("Failed to get weather forecast: " + result.status, "", "")
    return
  }

  const botResult = result.body as BotResult

  if (botResult.success === false) {
    bot.addError("Failed to get weather forecast: " + botResult.error, "", "")
    return
  }

  const { current, forecast } = botResult.params as TempResult

  bot.log.info(
    "Saving external collection: " +
      bot.saveRequest.collection +
      ", with upsert set to: " +
      bot.saveRequest.upsert,
  )
  bot.deletes.get().forEach((deleteItem) => {
    bot.log.info("Deleting item with old id: " + deleteItem.getId())
  })
  bot.inserts.get().forEach((insertItem) => {
    bot.log.info("inserting item with id: " + insertItem.getId())
    insertItem.set("uesio/tests.current", current)
    insertItem.set("uesio/tests.forecast", forecast)
  })
  bot.updates.get().forEach((changeItem) => {
    bot.log.info("updating item with id: " + changeItem.getId())
    changeItem.setAll({
      "uesio/tests.current": current,
      "uesio/tests.forecast": forecast,
    })
  })
}
