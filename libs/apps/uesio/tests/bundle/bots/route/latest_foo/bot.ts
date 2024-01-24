import { RouteBotApi } from "@uesio/bots"

export default function latest_foo(bot: RouteBotApi) {
	bot.response.redirectToURL("https://docs.ues.io/files/foo/latest")
}
