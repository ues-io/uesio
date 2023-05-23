import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { AutocompleteResponse, platform } from "../../platform/platform"
import { getErrorString } from "../utils"

// The key for the entire band
const AI_BAND = "ai"

interface AutocompleteSignal extends SignalDefinition {
	input: string
	model: string
	format: string
	maxResults?: number | string
	useCache?: boolean
}

const signals: Record<string, SignalDescriptor> = {
	[`${AI_BAND}/AUTOCOMPLETE`]: {
		dispatcher: async (
			signalInvocation: AutocompleteSignal,
			context: Context
		) => {
			const { input, model, format, maxResults, useCache } =
				signalInvocation

			try {
				const response: AutocompleteResponse =
					await platform.autocomplete(context, {
						model: context.mergeString(model),
						format: context.mergeString(format),
						input: context.mergeString(input),
						maxResults: parseInt(
							context.merge(maxResults) as string,
							10
						),
						useCache,
					})

				if (response?.error) {
					return context.addErrorFrame([response.error])
				}

				// If this invocation was given a stable identifier,
				// expose its outputs for later use
				if (response && signalInvocation.stepId) {
					return context.addSignalOutputFrame(
						signalInvocation.stepId,
						{
							choices: response.choices,
						}
					)
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
