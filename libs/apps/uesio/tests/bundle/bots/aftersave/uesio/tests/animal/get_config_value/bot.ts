import { AfterSaveBotApi } from "@uesio/bots"
export default function get_config_value(bot: AfterSaveBotApi) {
	bot.getConfigValue("uesio/tests.studio_apis_url")
}
