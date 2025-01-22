import { AfterSaveBotApi } from "@uesio/bots"
export default function nozebras(bot: AfterSaveBotApi) {
  bot.inserts.get().forEach((change) => {
    const species = change.get("uesio/tests.species") as string
    if (species === "Zebra") {
      bot.addError("No Zebras Allowed!")
    }
  })
}
