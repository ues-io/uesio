import { ListenerBotApi } from "@uesio/bots"

export default function signup(bot: ListenerBotApi) {
	const redirect = "/site/auth/uesio/studio/platform/signup/confirm"
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const code = bot.params.get("code")
	const host = bot.params.get("host")
	const link = host + redirect + "?code=" + code + "&username=" + username
	const contenttype = "text/html"
	const from = "info@ues.io"
	const subject = "Welcome to the ues.io studio!"
	const body = `
	<!DOCTYPE html>
	<html>
		<body>
			Hi ${username},<br/>
			<br/>
			Thank you for registering for an account with the ues.io studio!<br/>
			<br/>
			To complete your account set up, please confirm using the link below:<br/>
			${link}<br/>
			<br/>
			Cheers!<br/>
			<br/>
			The team at ues.io
		</body>
	</html>`

	bot.runIntegrationAction("uesio/core.sendgrid", "sendemail", {
		to: [email],
		from,
		subject,
		plainbody: body,
		contenttype,
	})

	/*
	// FOR LOCAL TESTING WITH RESEND
	const response = bot.http.request({
		headers: {
			Authorization: "Bearer [your-bearer-token]",
			"Content-Type": "application/json",
		},
		method: "POST",
		url: "https://api.resend.com/emails",
		body: {
			from: "onboarding@resend.dev",
			to: [email],
			subject,
			html: body,
		},
	})

	if (response.code != 200) {
		throw new Error(response.body + "")
	}
	*/
}
