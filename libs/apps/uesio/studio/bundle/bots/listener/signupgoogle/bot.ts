import { ListenerBotApi } from "@uesio/bots"

export default function signupgoogle(bot: ListenerBotApi) {
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const firstName = bot.params.get("firstname")
	const lastName = bot.params.get("lastname")
	const toName = firstName && lastName ? `${firstName} ${lastName}` : username
	const contentType = "text/html"
	const from = "info@ues.io"
	const fromName = "the ues.io team"

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
				A user signed up using Google for a studio account on site ${site.getName()} and domain ${site.getDomain()}.<br/>
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
}
