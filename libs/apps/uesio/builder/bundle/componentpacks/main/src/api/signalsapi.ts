import { collection, signal as signalApi, component, wire } from "@uesio/ui"

const allSignals = Object.entries(signalApi.getSignals()).map(
	([signal, signalDescriptor]) => ({
		value: signal,
		label: signalDescriptor.label || signal,
		title: signalDescriptor.description || signal,
	})
)
allSignals.sort((a, b) => a.label.localeCompare(b.label))

const defaultSignalProps = (): component.ComponentProperty[] => [
	{
		name: "signal",
		label: "Signal",
		type: "SELECT",
		options: collection.addBlankSelectOption(allSignals),
	},
]

const getSignalProperties = (signalPlainWireRecord: wire.PlainWireRecord) => {
	const signalDefinition = signalPlainWireRecord as signalApi.SignalDefinition
	const descriptor =
		signalApi.getSignal(signalDefinition.signal) ||
		signalApi.getComponentSignalDefinition()
	return [
		...defaultSignalProps(),
		...(descriptor.properties
			? descriptor.properties(signalDefinition)
			: []),
	]
}

export { getSignalProperties }
