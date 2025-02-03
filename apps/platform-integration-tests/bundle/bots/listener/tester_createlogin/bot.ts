import { ListenerBotApi, WireRecord } from "@uesio/bots"

export default function tester_createlogin(bot: ListenerBotApi) {
  const namespace = bot.getNamespace()
  const redirect = "/site/app/uesio/appkit/changepassword"
  const username = bot.params.get("username") as string
  const email = bot.params.get("email") as string
  const code = bot.params.get("code") as string
  const host = bot.params.get("host") as string
  const link = host + redirect + "?code=" + code + "&username=" + username
  const contentType = "text/html"
  const from = "noreply@ues.io"
  const fromName = "ues.io"
  const subject = "User created in tests"
  const body = `
	<!DOCTYPE html>
	<html>
		<body>
			A user account has been created for you in tests.<br/>
			Your username is: ${username}.<br/>
			<br/>
			You can set your password and log in using the link below:<br/>
			${link}
		</body>
	</html>`

  bot.asAdmin.save(`${namespace}.email_log`, [
    {
      [`${namespace}.to_emails`]: [email],
      [`${namespace}.to_names`]: [username],
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
