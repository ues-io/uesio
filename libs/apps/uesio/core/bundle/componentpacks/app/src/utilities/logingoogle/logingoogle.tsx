import { definition, api, styles } from "@uesio/ui"
import { useEffect } from "react"

declare global {
	interface Window {
		googleAuthCallback: (response: unknown) => void
	}
}

const LoginGoogle: definition.UtilityComponent = (props) => {
	const { context } = props
	const classes = styles.useUtilityStyleTokens(
		{
			root: ["grid", "justify-center"],
		},
		props
	)

	window.googleAuthCallback = (response: object) => {
		api.signal.run(
			{
				signal: "user/LOGIN",
				authSource: "uesio/core.google",
				payload: response,
			},
			context
		)
	}

	useEffect(() => {
		const script = document.createElement("script")
		script.src = "https://accounts.google.com/gsi/client"
		script.async = true
		document.body.appendChild(script)
		return () => {
			document.body.removeChild(script)
		}
	}, [])

	const clientId = api.view.useConfigValue("uesio/core.google_auth_client_id")

	if (!clientId) {
		return null
	}

	return (
		<div className={classes.root}>
			<div
				id="g_id_onload"
				data-client_id={clientId}
				data-callback="googleAuthCallback"
				data-auto_prompt="false"
			/>
			<div
				className="g_id_signin"
				data-type="standard"
				data-size="large"
				data-theme="outline"
				data-shape="rectangular"
				data-logo_alignment="left"
			/>
		</div>
	)
}

export default LoginGoogle
