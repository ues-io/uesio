import { ListenerBotApi } from "@uesio/bots"

export default function signupgoogle(bot: ListenerBotApi) {
	const username = bot.params.get("username")
	const email = bot.params.get("email")
	const host = bot.params.get("host")
	const firstName = bot.params.get("firstname")
	const lastName = bot.params.get("lastname")
	const toName = firstName && lastName ? `${firstName} ${lastName}` : username
	const from = "info@updates.ues.io"
	const subject = "Welcome to the ues.io studio!"

	const templateParams = {
		titleText: "Start building great apps.",
		bodyText: "Welcome to ues.io studio. Your account has been created.",
		username,
		laterLink: host,
		logoUrl: host + bot.getFileUrl("uesio/core.logo", ""),
		logoAlt: "ues.io",
		logoWidth: "40",
		footerText: "ues.io - Your app platform",
	}

	const text = bot.mergeTemplateFile(
		"uesio/appkit.emailtemplates",
		"templates/signupnotify.txt",
		templateParams
	)

	const html = bot.mergeTemplateFile(
		"uesio/appkit.emailtemplates",
		"templates/signupnotify.html",
		templateParams
	)

	bot.runIntegrationAction("uesio/appkit.resend", "sendemail", {
		to: email,
		from,
		subject,
		html,
		text,
	})

	const site = bot.getSession().getSite()

	const signupNotifyEmail = bot.asAdmin.getConfigValue(
		"uesio/studio.signup_notify_email"
	)

	if (signupNotifyEmail) {
		const templateParams = {
			logoUrl: host + bot.getFileUrl("uesio/core.logo", ""),
			logoAlt: "ues.io",
			logoWidth: "40",
			footerText: "ues.io - Your app platform",
		}
		const notifyText = bot.mergeTemplateFile(
			"uesio/appkit.emailtemplates",
			"templates/genericmessage.txt",
			{
				...templateParams,
				titleText: "Someone just signed up.",
				bodyText: `A user signed up using Google for a studio account on site ${site.getName()} and domain ${site.getDomain()}.

Name: ${toName}
Username: ${username}
Email: ${email}

Cheers!

The team at ues.io`,
			}
		)

		const notifyHtml = bot.mergeTemplateFile(
			"uesio/appkit.emailtemplates",
			"templates/genericmessage.html",
			{
				...templateParams,
				titleText: "Someone just signed up.",
				bodyText: `
					A user signed up using Google for a studio account on site ${site.getName()} and domain ${site.getDomain()}.<br/>
					<br/>
					Name: ${toName}<br/>
					Username: ${username}<br/>
					Email: ${email}<br/><br/>
					Cheers!<br/>
					<br/>
					The team at ues.io
				`,
			}
		)

		bot.runIntegrationAction("uesio/appkit.resend", "sendemail", {
			to: signupNotifyEmail,
			from,
			subject: `New signup in uesio studio: ${username}`,
			html: notifyHtml,
			text: notifyText,
		})
	}
}
