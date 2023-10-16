import { ListenerBotApi } from "@uesio/bots"
// @ts-ignore
function forgotpassword(bot: ListenerBotApi) {
	const redirect = "/site/app/uesio/core/changepassword"
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const code = bot.params.get("code")
	const host = bot.params.get("host")
	const link = host + redirect + "?code=" + code + "&username=" + username
	const contenttype = "text/html"
	const from = "info@ues.io"
	const subject = "Password change requested in ues.io studio"
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

	bot.runIntegrationAction("uesio/core.sendgrid", "sendEmail", {
		to: [email],
		from,
		subject,
		plainbody: body,
		contenttype,
	})
}
