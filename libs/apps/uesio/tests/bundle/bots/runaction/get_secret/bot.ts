import { RunActionBotApi } from "@uesio/bots"

export default function get_secret(bot: RunActionBotApi) {
	bot.addResult("secretValue", bot.getCredentials().apikey)
}
