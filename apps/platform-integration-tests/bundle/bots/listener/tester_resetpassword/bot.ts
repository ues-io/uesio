import { ListenerBotApi, WireRecord } from "@uesio/bots"

export default function tester_forgotpassword(bot: ListenerBotApi) {
  const namespace = bot.getNamespace()
  const redirect = "/site/app/uesio/appkit/changepassword"
  const username = bot.params.get("username") as string
  const email = bot.params.get("email") as string
  const code = bot.params.get("code") as string
  const host = bot.params.get("host") as string
  const link = host + redirect + "?code=" + code + "&username=" + username
  const contentType = "text/html"
  const from = "noreply@ues.io"
  const subject = "Password change requested in tests"
  const body = `
	<!DOCTYPE html>
	<html>
		<body>
			Hi ${username},<br/>
			<br/>
			There was a request to change your password!<br/>
			<br/>
			If you did not make this request then please ignore this email.<br/>
			<br/>
			Otherwise, please click this link to change your password: ${link}
		</body>
	</html>`

  bot.asAdmin.save(`${namespace}/email_log`, [
    {
      [`${namespace}/to_emails`]: [email],
      [`${namespace}/to_names`]: [email],
      [`${namespace}/from_email`]: from,
      [`${namespace}/from_name`]: from,
      [`${namespace}/subject`]: subject,
      [`${namespace}/html_body`]: body,
      [`${namespace}/content_type`]: contentType,
      [`${namespace}/verification_code`]: code,
      [`${namespace}/link`]: link,
    } as unknown as WireRecord,
  ])
}
