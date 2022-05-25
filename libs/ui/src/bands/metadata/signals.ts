import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"

// The key for the entire band
const METADATA_BAND = "metadata"

const signals: Record<string, SignalDescriptor> = {
	[`${METADATA_BAND}/BUNDLE`]: {
		dispatcher:
			(signal: SignalDefinition, context: Context) =>
			async (dispatch, getState, api) => {
				const response = await api.bundle(context)
				if (response.error) {
					return context.addFrame({ errors: [response.error] })
				}
				return context
			},
		label: "Bundle",
		properties: () => [],
	},
}
export default signals
