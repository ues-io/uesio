import { RunActionBotApi } from "@uesio/bots"

type ResendResponse = {
  message: string
}

export default function resend_sendemail(bot: RunActionBotApi) {
  const response = bot.http.request<unknown, ResendResponse>({
    url: "https://api.resend.com/emails",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      to: bot.params.get("to"),
      from: bot.params.get("from"),
      subject: bot.params.get("subject"),
      html: bot.params.get("html"),
      text: bot.params.get("text"),
    },
  })
  if (response.code !== 200) {
    throw new Error(response.body.message)
  }
}
