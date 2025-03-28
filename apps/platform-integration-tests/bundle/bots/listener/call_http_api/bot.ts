import { ListenerBotApi } from "@uesio/bots"

type CallBotResponse = {
  error?: string
  params?: Record<string, unknown>
  success: boolean
}

export default function call_http_api(bot: ListenerBotApi) {
  const a = (bot.params.get("a") as number) || 0
  const b = (bot.params.get("b") as number) || 0
  bot.log.info("inputs: a=" + a + ", b=" + b)
  // Call the bot HTTP API
  const response = bot.http.request({
    method: "POST",
    url: `${bot.getHostUrl()}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers`,
    body: JSON.stringify({
      a,
      b,
    }),
    headers: {
      "Content-Type": "application/json",
      Cookie: "sessid=" + bot.getSession().getId(),
    },
  })
  const result = response.body as CallBotResponse
  bot.log.info("response headers : " + JSON.stringify(response.headers))
  bot.log.info("result was success? [auto]", result.success)
  bot.addResult("sum", result?.params?.answer || "")
  bot.addResult("multiplied", a * b)
  bot.addResult("status", response.status)
  bot.addResult("statusCode", response.code)
  bot.addResult("contentType", response.headers["Content-Type"])
}
