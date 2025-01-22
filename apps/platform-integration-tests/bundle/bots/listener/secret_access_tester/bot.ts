import { ListenerBotApi } from "@uesio/bots"

export default function secret_access_tester(bot: ListenerBotApi) {
  const integrationName = bot.params.get("integrationName") as string
  const actionName = bot.params.get("actionName") as string
  const results = bot.runIntegrationAction(
    integrationName,
    actionName,
    {},
  ) as Record<string, string>
  bot.log.info("Got result back from integration action")
  bot.addResult("secretValue", results.secretValue)
}
