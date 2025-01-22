import { ListenerBotApi } from "@uesio/bots"

export default function call_forbidden_run_action(bot: ListenerBotApi) {
  const result = bot.runIntegrationAction(
    "uesio/tests.weather_api",
    "privileged_action",
    {
      latitude: 11,
      longitude: -11,
    },
  ) as Record<string, string>
  bot.log.info("result from calling forbidden action", result)
  bot.addResult("error", "FORBIDDEN")
}
