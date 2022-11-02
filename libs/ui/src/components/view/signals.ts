import {
	ComponentSignalDescriptor,
	SignalDefinition,
} from "../../definition/signal"

interface SetParamSignal extends SignalDefinition {
	param: string
	value: string
}

interface SetParamsSignal extends SignalDefinition {
	params: Record<string, string>
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
		properties: () => [
			{
				name: "param",
				type: "TEXT",
				label: "Param",
			},
		],
	},
	SET_PARAMS: {
		dispatcher: (
			state: Record<string, string>,
			signal: SetParamsSignal,
			context
		) => {
			const params = context.mergeMap(signal.params)
			Object.keys(params).forEach((key) => {
				state[key] = params[key]
			})
		},
		label: "Set Params",
		properties: () => [
			{
				name: "params",
				type: "PROPLISTS",
				label: "Params",
				nameTemplate: "${param}",
				properties: [
					{
						name: "param",
						type: "TEXT",
						label: "Param",
					},
				],
			},
		],
	},
}

export default signals
