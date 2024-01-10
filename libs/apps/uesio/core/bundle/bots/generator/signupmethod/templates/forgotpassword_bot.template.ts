import { ListenerBotApi } from "@uesio/bots"

export default function ${signupMethodName}_forgotpassword(bot: ListenerBotApi) {
	const redirect = "/site/app/uesio/core/changepassword?signupmethod=${signupMethodName}"
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const code = bot.params.get("code")
	const host = bot.params.get("host")
	const link = host + redirect + "&code=" + code + "&username=" + username
	const contenttype = "text/html"
	const from = "${fromEmail}"
	const subject = "Password change requested in ${companyName}"
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
