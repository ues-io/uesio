import {
	ComponentSignalDescriptor,
	SignalDefinition,
} from "../../definition/signal"

interface SetParamSignal extends SignalDefinition {
	param: string
	value: string
}

const signals: Record<string, ComponentSignalDescriptor> = {
	SET_PARAM: {
		dispatcher: (
			state: Record<string, string>,
			signal: SetParamSignal,
			context
		) => {
			const value = context.merge(signal.value)
			state[signal.param] = value
		},
		label: "Set Param",
		properties: () => [],
	},
}

export default signals
