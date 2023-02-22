import { collection, context, definition, wire } from "@uesio/ui"
import collectionSignals from "../signals/collection"
import botSignals from "../signals/bot"
import notificationSignals from "../signals/notification"
import panelSignals from "../signals/panel"
import userSignals from "../signals/user"
import routeSignals from "../signals/route"
import wireSignals from "../signals/wire"
import { ComponentProperty } from "../properties/componentproperty"
import { getComponentDef } from "./stateapi"

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

const COMPONENT_SIGNAL_PREFIX = "COMPONENT/"

const getSignalProperties = (
	signalPlainWireRecord: wire.PlainWireRecord,
	context: context.Context
) => {
	const signalDefinition = signalPlainWireRecord as SignalDefinition
	let descriptor = signalDefinitionRegistry[signalDefinition.signal]
	// Load Component-specific signal definitions dynamically from Component definition
	if (
		!descriptor &&
		signalDefinition.signal &&
		signalDefinition.signal.startsWith(COMPONENT_SIGNAL_PREFIX)
	) {
		const cmpSignalParts = signalDefinition.signal
			.substring(COMPONENT_SIGNAL_PREFIX.length)
			.split("/")
		if (cmpSignalParts.length === 3) {
			const cmpSignalName = cmpSignalParts.pop() as string
			const componentDef = getComponentDef(
				context,
				cmpSignalParts.join("/")
			)
			if (
				componentDef &&
				componentDef.signals &&
				componentDef.signals[cmpSignalName]
			) {
				descriptor = componentDef.signals[cmpSignalName]
			}
		}
	}
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
