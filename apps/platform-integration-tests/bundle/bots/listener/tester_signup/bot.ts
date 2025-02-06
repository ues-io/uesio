import { ListenerBotApi, WireRecord } from "@uesio/bots"

import type { Params } from "@uesio/app/bots/listener/uesio/tests/tester_signup"

export default function tester_signup(bot: ListenerBotApi<Params>) {
  const namespace = bot.getNamespace()
  const redirect =
    "/site/auth/" + namespace.replace(".", "/") + "/tester/signup/confirm"
  const username = bot.params.get("username")
  const email = bot.params.get("email")
  const code = bot.params.get("code")
  const host = bot.params.get("host")
  const firstName = bot.params.get("firstname")
  const lastName = bot.params.get("lastname")
  const toName = firstName && lastName ? `${firstName} ${lastName}` : username
  const link = `${host}${redirect}?code=${code}&username=${username}`
  const contentType = "text/html"
  const from = "noreply@ues.io"
  const fromName = "ues.io"
  const subject = "Welcome to tests!"
  const body = `
	<!DOCTYPE html>
	<html>
		<body>
			Hi ${toName},<br/>
			<br/>
			Thank you for registering for an account with tests!<br/>
			<br/>
			To complete your account set up, please confirm using the link below:<br/>
			${link}<br/>
			<br/>
			Cheers!<br/>
			<br/>
			the tests team
		</body>
	</html>`

  bot.asAdmin.save(`${namespace}.email_log`, [
    {
      [`${namespace}.to_emails`]: [email],
      [`${namespace}.to_names`]: [toName],
      [`${namespace}.from_email`]: from,
      [`${namespace}.from_name`]: fromName,
      [`${namespace}.subject`]: subject,
      [`${namespace}.html_body`]: body,
      [`${namespace}.content_type`]: contentType,
      [`${namespace}.verification_code`]: code,
      [`${namespace}.link`]: link,
    } as unknown as WireRecord,
  ])
}
