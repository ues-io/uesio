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
				const promise = new Promise((resolve, reject) => {
					platform.runIntegrationAction(
						context,
						integration,
						action,
						mergedParams,
						(finalResult, xhr) => {
							// Handle the response based on the content type
							if (
								xhr
									.getResponseHeader("Content-Type")
									?.includes("json")
							) {
								console.log("we are ")
								resolve(JSON.parse(finalResult))
							} else {
								console.log(
									"in onDOne callback, xhr responseState: " +
										xhr.readyState +
										", status: " +
										xhr.status
								)
								resolve(finalResult)
							}
						},
						reject,
						(chunk: string) => {
							if (onChunk && stepId) {
								console.log(
									"invoking onChunk signals, chunk: " + chunk
								)
								runMany(
									onChunk,
									context.addSignalOutputFrame(stepId, {
										data: chunk,
									})
								).catch(reject)
							}
						}
					)
				})

				const finalResult = await promise
				console.log("PROMISE SHOULD BE RESOLVED - FINAL: ", finalResult)
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
