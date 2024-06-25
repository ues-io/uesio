import { Context, Mergeable } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { BotParams, platform } from "../../platform/platform"
import { getErrorString } from "../utils"
import { MetadataKey } from "../../metadata/types"
import { runMany } from "../../signals/signals"

// The key for the entire band
const INTEGRATION_BAND = "integration"

type OnChunkFunction = (chunk: string) => Promise<Context>

export interface RunActionSignal extends SignalDefinition {
	integrationType: MetadataKey
	integration: MetadataKey
	action: string
	params?: BotParams
	// onChunk allows for signals to be invoked for each chunk of streaming data received
	onChunk?: SignalDefinition[] | OnChunkFunction
}

const errorBoundaryStart = "-----ERROR-----"
const errorBoundaryEnd = "-----ENDERROR-----"

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
			const mergedParams = context.mergeStringMap(
				params as Record<string, Mergeable>
			)

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
				const noSniff =
					response.headers.get("X-Content-Type-Options") === "nosniff"
				if (contentType?.includes("json")) {
					finalResult = await response.json()
				} else if (response.body && noSniff) {
					// Handle streaming responses
					const chunks = [] as (string | object)[]
					const chunkWriterStream = new WritableStream<string>({
						async write(chunk) {
							chunks.push(chunk)
							if (stepId && onChunk) {
								if (typeof onChunk === "function") {
									onChunk(chunk)
								} else if (Array.isArray(onChunk)) {
									await runMany(
										onChunk,
										context.addSignalOutputFrame(
											stepId,
											chunk
										)
									)
								}
							}
						},
					})

					// Stream the response through our text decoder
					await response.body
						.pipeThrough(new TextDecoderStream())
						.pipeTo(chunkWriterStream)

					// Our final output should be text, not an array of objects
					finalResult = (chunks as string[]).join("")
				} else {
					finalResult = await response.text()
				}

				// Check if the text contains a special error message boundary
				if (
					typeof finalResult === "string" &&
					finalResult.includes(errorBoundaryStart)
				) {
					throw new Error(
						finalResult.substring(
							finalResult.indexOf(errorBoundaryStart) +
								errorBoundaryStart.length,
							finalResult.indexOf(errorBoundaryEnd)
						)
					)
				}
				// If this invocation was given a stable identifier,
				// expose its outputs for later use
				if (stepId) {
					return context.addSignalOutputFrame(stepId, finalResult)
				}
				return context
			} catch (error) {
				console.error(error)
				// TODO: Recommend putting errors within signal output frame as well
				const message = getErrorString(error)
				return context.addErrorFrame([message])
			}
		},
	},
}
export default signals
