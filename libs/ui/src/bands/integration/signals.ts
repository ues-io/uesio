import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { BotParams, platform } from "../../platform/platform"
import { getErrorString } from "../utils"
import { MetadataKey } from "../../metadata/types"

// The key for the entire band
const INTEGRATION_BAND = "integration"

interface RunActionSignal extends SignalDefinition {
	integration: MetadataKey
	action: string
	params: BotParams
}

const signals: Record<string, SignalDescriptor> = {
	[`${INTEGRATION_BAND}/RUN_ACTION`]: {
		dispatcher: async (
			signalInvocation: RunActionSignal,
			context: Context
		) => {
			const { integration, action, params } = signalInvocation
			const mergedParams = context.mergeStringMap(params)

			try {
				const response = await platform.runIntegrationAction(
					context,
					integration,
					action,
					mergedParams || {}
				)

				// If this invocation was given a stable identifier,
				// expose its outputs for later use
				if (response && signalInvocation.stepId) {
					return context.addSignalOutputFrame(
						signalInvocation.stepId,
						response
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
