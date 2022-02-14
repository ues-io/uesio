import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import bundle from "./operations/bundle"
import { unwrapResult } from "@reduxjs/toolkit"

// The key for the entire band
const METADATA_BAND = "metadata"

const signals: Record<string, SignalDescriptor> = {
	[`${METADATA_BAND}/BUNDLE`]: {
		dispatcher:
			(signal: SignalDefinition, context: Context) =>
			async (dispatch) => {
				const response = await dispatch(
					bundle({
						context,
					})
				).then(unwrapResult)
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
