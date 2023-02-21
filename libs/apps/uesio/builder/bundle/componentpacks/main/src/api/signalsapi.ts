import { collection, signal as signalApi, component } from "@uesio/ui"

const defaultSignalProps = (): component.ComponentProperty[] => [
	{
		name: "signal",
		label: "Signal",
		type: "SELECT",
		options: collection.addBlankSelectOption(
			Object.entries(signalApi.getSignals()).map(
				([signal, signalDescriptor]) => ({
					value: signal,
					label: signalDescriptor.label || signal,
					title: signalDescriptor.description || signal,
				})
			)
		),
	},
]

const getSignalProperties = (signal: signalApi.SignalDefinition) => {
	const registry = signalApi.getSignals()
	const descriptor = registry[signal?.signal]
	// TODO: WHAT IS NOT WORKING HERE???
	// const descriptor =
	// 	registry[signal?.signal] || signalApi.ComponentSignalDescriptor
	return [
		...defaultSignalProps(),
		...(descriptor.properties ? descriptor.properties(signal) : []),
	]
}

export { getSignalProperties }
