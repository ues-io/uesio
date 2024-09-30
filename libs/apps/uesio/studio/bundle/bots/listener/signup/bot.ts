import { ListenerBotApi } from "@uesio/bots"

export default function signup(bot: ListenerBotApi) {
	const redirect = `/site/auth/${bot.getNamespace()}/platform/signup/confirm`
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const code = bot.params.get("code")
	const host = bot.params.get("host")
	const firstName = bot.params.get("firstname")
	const lastName = bot.params.get("lastname")
	const toName = firstName && lastName ? `${firstName} ${lastName}` : username
	const link = `${host}${redirect}?code=${code}&username=${username}`
	const contentType = "text/html"
	const from = "info@ues.io"
	const fromName = "the ues.io team"
	const subject = "Welcome to the ues.io studio!"
	const body = `
	<!DOCTYPE html>
	<html>
		<body>
			Hi ${toName},<br/>
			<br/>
			Thank you for registering for an account with the ues.io studio!<br/>
			<br/>
			To complete your account set up, please confirm using the link below:<br/>
			${link}<br/>
			<br/>
			For some video assistance you can visit our <a href="https://www.youtube.com/channel/UCPanoza3zR9zCgn7Y4dg6sw">YouTube channel</a> or take a look at our <a href="https://docs.ues.io/">documents section.</a> <br/>
			<br/>
			Best Regards<br/>
			<br/>
			The team at ues.io
		</body>
	</html>`

	const site = bot.getSession().getSite()

	const signupNotifyEmail = bot.asAdmin.getConfigValue(
		"uesio/studio.signup_notify_email"
	)

	if (signupNotifyEmail) {
		const notifyBody = `
		<!DOCTYPE html>
		<html>
			<body>
				Hi ues.io Studio Administrator,<br/>
				<br/>
				A user signed up for a studio account on site ${site.getName()} and domain ${site.getDomain()}.<br/>
				<br/>
				Name: ${toName}<br/>
				Username: ${username}<br/>
				Email: ${email}<br/><br/>
				Cheers!<br/>
				<br/>
				The team at ues.io
			</body>
		</html>`

		bot.runIntegrationAction("uesio/core.sendgrid", "sendemail", {
			to: [signupNotifyEmail],
			toNames: ["Studio Administrator"],
			from,
			fromName,
			subject: `New signup in uesio studio: ${toName}`,
			plainBody: notifyBody,
			contentType,
		})
	}

	bot.runIntegrationAction("uesio/core.sendgrid", "sendemail", {
		to: [email],
		toNames: [toName],
		from,
		fromName,
		subject,
		plainBody: body,
		contentType,
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
