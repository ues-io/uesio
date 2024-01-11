import { ListenerBotApi } from "@uesio/bots"

export default function tester_forgotpassword(bot: ListenerBotApi) {
	const namespace = bot.getNamespace()
	const redirect = "/site/app/uesio/core/changepassword?signupmethod=" + namespace + "tester"
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const code = bot.params.get("code")
	const host = bot.params.get("host")
	const link = host + redirect + "&code=" + code + "&username=" + username
	const contenttype = "text/html"
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

	bot.runIntegrationAction("uesio/core.sendgrid", "sendemail", {
		to: [email],
		from,
		subject,
		plainbody: body,
		contenttype,
	})
}
