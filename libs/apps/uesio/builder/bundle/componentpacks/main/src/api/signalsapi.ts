import { collection, context, definition, wire } from "@uesio/ui"
import collectionSignals from "../signals/collection"
import botSignals from "../signals/bot"
import notificationSignals from "../signals/notification"
import panelSignals from "../signals/panel"
import userSignals from "../signals/user"
import routeSignals from "../signals/route"
import wireSignals from "../signals/wire"
import { ComponentProperty } from "../properties/componentproperty"

const signalDefinitionRegistry: Record<string, SignalDescriptor> = {
	...collectionSignals,
	...botSignals,
	...routeSignals,
	...userSignals,
	...wireSignals,
	...panelSignals,
	...notificationSignals,
}

type SignalDescriptor = {
	label: string
	description: string
	properties: (signal: SignalDefinition) => ComponentProperty[]
}

type ComponentSignalDescriptor = {
	label?: string
	properties?: (signal: SignalDefinition) => ComponentProperty[]
	target?: string
}

type SignalDefinition = {
	signal: string
	[key: string]: definition.Definition
	"uesio.context"?: context.ContextOptions
	stepId?: string
	onerror?: {
		continue: boolean
		notify: boolean
		signals: SignalDefinition[]
	}
}

const allSignals = Object.entries(signalDefinitionRegistry).map(
	([signal, signalDescriptor]) => ({
		value: signal,
		label: signalDescriptor.label || signal,
		title: signalDescriptor.description || signal,
	})
)
allSignals.sort((a, b) => a.label.localeCompare(b.label))

const defaultSignalProps = [
	{
		name: "signal",
		label: "Signal",
		type: "SELECT",
		options: collection.addBlankSelectOption(allSignals),
	},
]

const getSignalProperties = (signalPlainWireRecord: wire.PlainWireRecord) => {
	const signalDefinition = signalPlainWireRecord as SignalDefinition
	const descriptor = signalDefinitionRegistry[signalDefinition.signal] || {}
	return [
		...defaultSignalProps,
		...(descriptor.properties
			? descriptor.properties(signalDefinition)
			: []),
	]
}

export {
	getSignalProperties,
	SignalDefinition,
	SignalDescriptor,
	ComponentSignalDescriptor,
}
