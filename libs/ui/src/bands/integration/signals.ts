import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { BotParams, platform } from "../../platform/platform"
import { getErrorString } from "../utils"
import { MetadataKey } from "../../metadata/types"
import { runMany } from "../../signals/signals"

// The key for the entire band
const INTEGRATION_BAND = "integration"

export interface RunActionSignal extends SignalDefinition {
	integrationType: MetadataKey
	integration: MetadataKey
	action: string
	params?: BotParams
	// onChunk allows for signals to be invoked for each chunk of streaming data received
	onChunk?: SignalDefinition[]
}

const signals: Record<string, SignalDescriptor> = {
	[`${INTEGRATION_BAND}/RUN_ACTION`]: {
		dispatcher: async (
			signalInvocation: RunActionSignal,
			context: Context
		) => {
			const {
				integration,
				action,
				params = {},
				stepId,
				onChunk,
			} = signalInvocation
			const mergedParams = context.mergeStringMap(params)

			try {
				const response = await platform.runIntegrationAction(
					context,
					integration,
					action,
					mergedParams
				)

				let finalResult

				// Handle the response based on the content type
				const contentType = response.headers.get("content-type")
				const transferEncoding =
					response.headers.get("transfer-encoding")
				console.log("content type: " + contentType)
				console.log("transfer encoding: " + transferEncoding)
				if (contentType?.includes("json")) {
					finalResult = await response.json()
				} else if (response.body && transferEncoding === "chunked") {
					// Handle streaming responses
					console.log("got a chunked response!")
					const reader = response.body.getReader()
					const decoder = new TextDecoder()
					let streamResult = await reader.read()
					const chunks = []
					while (!streamResult.done) {
						const text = decoder.decode(streamResult.value)
						console.log(
							`RUN_ACTION - CHUNK[${chunks.length}]: `,
							text
						)
						chunks.push(text)
						if (onChunk && stepId) {
							console.log("invoking onChunk signals")
							await runMany(
								onChunk,
								context.addSignalOutputFrame(stepId, {
									data: text,
								})
							)
						}
						streamResult = await reader.read()
					}
					finalResult = chunks.join("")
				} else {
					finalResult = await response.text()
				}

				console.log("RUN_ACTION - FINAL: ", finalResult)
				// If this invocation was given a stable identifier,
				// expose its outputs for later use
				if (stepId) {
					return context.addSignalOutputFrame(stepId, {
						data: finalResult,
					})
				}
				return context
			} catch (error) {
				// TODO: Recommend putting errors within signal output frame as well
				const message = getErrorString(error)
				return context.addErrorFrame([message])
			}
		},
	},
}
export default signals
