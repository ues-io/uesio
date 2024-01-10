import { ListenerBotApi } from "@uesio/bots"

export default function signup(bot: ListenerBotApi) {
	const namespace = bot.getNamespace()
	const redirect =
		"/site/auth/" + namespace + "/${signupMethodName}/signup/confirm"
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const code = bot.params.get("code")
	const host = bot.params.get("host")
	const firstName = bot.params.get("firstname")
	const lastName = bot.params.get("lastname")
	const toName = firstName && lastName ? `${firstName} ${lastName}` : username
	const link = `${host}${redirect}?code=${code}&username=${username}`
	const contentType = "text/html"
	const from = "${fromEmail}"
	const fromName = "${fromName}"
	const subject = "Welcome to ${companyName}!"
	const body = `
	<!DOCTYPE html>
	<html>
		<body>
			Hi ${toName},<br/>
			<br/>
			Thank you for registering for an account with ${companyName}!<br/>
			<br/>
			To complete your account set up, please confirm using the link below:<br/>
			${link}<br/>
			<br/>
			Cheers!<br/>
			<br/>
			The team at ${companyName}
		</body>
	</html>`

	bot.runIntegrationAction("uesio/core.sendgrid", "sendemail", {
		to: [email],
		toNames: [toName],
		from,
		fromName,
		subject,
		plainBody: body,
		contentType,
	})
}
