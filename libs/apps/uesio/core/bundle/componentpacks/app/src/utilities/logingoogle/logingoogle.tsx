import { definition, api, styles } from "@uesio/ui"
import { useEffect } from "react"

declare global {
	interface Window {
		googleAuthCallback: (response: unknown) => void
	}
}
const GOOGLE_LOGIN_SCRIPT_SRC = "https://accounts.google.com/gsi/client"
const GOOGLE_CLIENT_ID_CONFIG_KEY = "uesio/core.google_auth_client_id"
const StyleDefaults = Object.freeze({
	root: ["grid", "justify-center"],
})

interface GoogleLoginUtilityProps {
	onLogin?: (response: unknown) => void
}

const LoginGoogleUtility: definition.UtilityComponent<
	GoogleLoginUtilityProps
> = (props) => {
	const { onLogin } = props
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	window.googleAuthCallback = (response: unknown) => {
		onLogin?.(response)
	}

	useEffect(() => {
		const script = document.createElement("script")
		script.src = GOOGLE_LOGIN_SCRIPT_SRC
		script.async = true
		document.body.appendChild(script)
		return () => {
			document.body.removeChild(script)
		}
	}, [])

	const clientId = api.view.useConfigValue(GOOGLE_CLIENT_ID_CONFIG_KEY)

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

export default LoginGoogleUtility
