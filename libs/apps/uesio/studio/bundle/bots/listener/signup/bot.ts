import { ListenerBotApi } from "@uesio/bots"

import { Params } from "@uesio/app/bots/listener/uesio/studio/signup"

export default function signup(bot: ListenerBotApi<Params>) {
  // NOTE: This will not work for "signup" when in a workspace context. The thinking has been to
  // allow going through signup/login/etc. when developing in a workspace but the feature is not fully
  // implemented and should likely be using the impersonation logic vs. full signup/login if anything.
  // TODO: This needs to be adjusted, as appropriate, once a final decision is made on how auth related
  // activities should work in a workspace context.
  const redirect = `/site/auth/${bot.getNamespace()}/platform/signup/confirm`
  const username = bot.params.get("username")
  const email = bot.params.get("email")
  const code = bot.params.get("code")
  const host = bot.params.get("host")
  const firstName = bot.params.get("firstname")
  const lastName = bot.params.get("lastname")
  const toName = firstName && lastName ? `${firstName} ${lastName}` : username
  const link = host + redirect + "?code=" + code + "&username=" + username
  const from = "info@updates.ues.io"
  const subject = "Welcome to the ues.io studio!"

  const templateParams = {
    titleText: "Start building great apps.",
    bodyText:
      "Welcome to ues.io studio. Confirm your email to complete the signup process.",
    username,
    resetLink: link,
    laterLink: host,
    logoUrl: host + bot.getFileUrl("uesio/core.logo", ""),
    logoAlt: "ues.io",
    logoWidth: "40",
    footerText: "ues.io - Your app platform",
  }

  const text = bot.mergeTemplateFile(
    "uesio/appkit.emailtemplates",
    "templates/confirmemail.txt",
    templateParams,
  )

  const html = bot.mergeTemplateFile(
    "uesio/appkit.emailtemplates",
    "templates/confirmemail.html",
    templateParams,
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
    "uesio/studio.signup_notify_email",
  )

  const nl2br = (str: string) => {
    const breakTag = "<br>"
    const replaceStr = "$1" + breakTag
    return (str + "").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, replaceStr)
  }

  if (signupNotifyEmail) {
    const bodyText = `A user signed up for a studio account on site ${site.getName()} and domain ${site.getDomain()}.

Name: ${toName}
Username: ${username}
Email: ${email}

Cheers!

The team at ues.io`

    const notifyText = bot.mergeTemplateFile(
      "uesio/appkit.emailtemplates",
      "templates/genericmessage.txt",
      {
        ...templateParams,
        titleText: "Someone just signed up.",
        bodyText,
      },
    )

    const notifyHtml = bot.mergeTemplateFile(
      "uesio/appkit.emailtemplates",
      "templates/genericmessage.html",
      {
        ...templateParams,
        titleText: "Someone just signed up.",
        bodyText: nl2br(bodyText),
      },
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
