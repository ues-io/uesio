import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { MetadataKey } from "../../metadata/types"
import { platform } from "../../platform/platform"
import { getErrorString } from "../utils"

// The key for the entire band
const BAND = "oauth2"

const callbackEventName = "uesio.oauth2.callback"

interface OAuth2CallbackSignal extends SignalDefinition {
	state: string
}

export type OAuth2AuthorizationMetadataResponse = {
	authUrl: string
	state: string
}

type AuthorizationWindowDisplay = "popup" | "tab"

interface OAuth2AuthorizeSignal extends SignalDefinition {
	authUrl: string
	state: string
	display?: AuthorizationWindowDisplay
	timeout?: number
}

interface OAuth2AuthorizationMetadataSignal extends SignalDefinition {
	integration: MetadataKey
}

const signals: Record<string, SignalDescriptor> = {
	[`${BAND}/GET_AUTHORIZATION_METADATA`]: {
		dispatcher: async (
			signalInvocation: OAuth2AuthorizationMetadataSignal,
			context: Context
		) => {
			const { integration, stepId } = signalInvocation
			let authorizeMetadataResponse: OAuth2AuthorizationMetadataResponse
			try {
				authorizeMetadataResponse =
					await platform.getOAuth2RedirectMetadata(
						context,
						context.mergeString(integration)
					)
			} catch (e) {
				// TODO error handling - maybe add a notification?
				return context.addErrorFrame([getErrorString(e)])
			}

			if (!stepId) return context
			return context.addSignalOutputFrame(
				stepId,
				authorizeMetadataResponse
			)
		},
	},
	[`${BAND}/CALLBACK`]: {
		dispatcher: async (
			signalInvocation: OAuth2CallbackSignal,
			context: Context
		) => {
			const { state } = signalInvocation
			self.postMessage({
				name: callbackEventName,
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
			const { authUrl, state, timeout = 90 } = signalInvocation

			// Open the authorize window / tab
			const authorizeWindow = window.open(authUrl, "_blank")

			const authFlowPromise = new Promise((resolve, reject) => {
				// TODO: Listen for a message on the window itself?
				if (!authorizeWindow) {
					reject("failed to open window for OAuth authorization")
				} else {
					authorizeWindow.onclose = () => {
						reject("Authentication cancelled.")
					}
					authorizeWindow.onload = () => {
						// Detect if a 4xx error was returned, and surface that to the user as an error
						const textBody = authorizeWindow.document.textContent
						if (textBody?.includes("error=")) {
							const matches = textBody.match(
								/error=([^&]+)&error_description=([^&]+)/
							)
							console.log("matches", matches)
							reject(
								"Failed to authenticate. Error: " +
									matches?.join(", ")
							)
						}
						// Detect if the authentication succeeded
						if (textBody?.includes("Authentication successful")) {
							// TODO: Also verify state here?
							resolve(null)
						}
					}
					authorizeWindow.onmessage = (event) => {
						console.log("got message!", event)
						// Ignore events from any other origin
						if (event.origin !== window.location.origin) {
							return
						}
						if (event.data.name === callbackEventName) {
							console.log("checking state")
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
