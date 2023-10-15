import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { MetadataKey } from "../../metadata/types"
import { platform } from "../../platform/platform"
import { getErrorString } from "../utils"

// The key for the entire band
const BAND = "oauth2"

interface OAuth2CallbackSignal extends SignalDefinition {
	state: string
}

export type OAuth2RedirectMetadataResponse = {
	authUrl: string
	state: string
}

type AuthorizationWindowDisplay = "popup" | "tab"

interface OAuth2AuthorizeSignal extends SignalDefinition {
	integration: MetadataKey
	display?: AuthorizationWindowDisplay
	timeout?: number
}

const signals: Record<string, SignalDescriptor> = {
	[`${BAND}/CALLBACK`]: {
		dispatcher: async (
			signalInvocation: OAuth2CallbackSignal,
			context: Context
		) => {
			const { state } = signalInvocation
			self.postMessage({
				name: "uesio.oauth2.callback",
				data: {
					state,
				},
			})
			return context
		},
	},
	[`${BAND}/AUTHORIZE`]: {
		dispatcher: async (
			signalInvocation: OAuth2AuthorizeSignal,
			context: Context
		) => {
			const { integration, timeout = 90 } = signalInvocation
			let authorizeMetadataResponse: OAuth2RedirectMetadataResponse
			try {
				authorizeMetadataResponse =
					await platform.getOAuth2RedirectMetadata(
						context,
						integration
					)
			} catch (e) {
				// TODO error handling - maybe add a notification?
				return context.addErrorFrame([getErrorString(e)])
			}

			const { authUrl, state } = authorizeMetadataResponse

			const authFlowPromise = new Promise((resolve, reject) => {
				// Open the authorize window / tab
				const authorizeWindow = window.open(authUrl, "_blank")
				// TODO: Listen for a message on the window itself?
				if (!authorizeWindow) {
					reject("failed to open window for OAuth authorization")
				} else {
					authorizeWindow.onmessage = (event) => {
						// Ignore events from any other origin
						if (event.origin !== window.location.origin) {
							return
						}
						if (event.data.name === "uesio.oauth2.callback") {
							const { state: callbackState } = event.data.data
							if (callbackState === state) {
								resolve(null)
							}
						}
					}
					setTimeout(() => {
						reject(
							`Failed to authenticate within ${timeout} seconds`
						)
					}, timeout * 1000)
				}
			})

			try {
				await authFlowPromise
				console.log("authorization flow succeeded!")
			} catch (e) {
				console.error("authorization flow failed", e)
				// TODO error handling - maybe add a notification?
				return context.addErrorFrame([getErrorString(e)])
			}

			return context
		},
	},
}
export default signals
