import { ListenerBotApi } from "@uesio/bots"

export default function createlogin(bot: ListenerBotApi) {
	const redirect = "/site/app/uesio/core/changepassword"
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const code = bot.params.get("code")
	const host = bot.params.get("host")
	const link = host + redirect + "?code=" + code + "&username=" + username
	const contentType = "text/html"
	const from = "info@ues.io"
	const fromName = "ues.io"
	const subject = "User created in ues.io studio"
	const body = `
	<!DOCTYPE html>
	<html>
		<body>
			A user account has been created for you in ues.io studio.<br/>
			Your username is: ${username}.<br/>
			<br/>
			You can set your password and log in using the link below:<br/>
			${link}
		</body>
	</html>`

	bot.runIntegrationAction("uesio/core.sendgrid", "sendemail", {
		to: [email],
		toNames: [username],
		from,
		fromName,
		subject,
		plainBody: body,
		contentType,
	})
}
