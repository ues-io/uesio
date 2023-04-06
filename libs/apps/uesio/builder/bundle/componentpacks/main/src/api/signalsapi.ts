import { collection, context, definition, wire } from "@uesio/ui"
import collectionSignals from "../signals/collection"
import aiSignals from "../signals/ai"
import botSignals from "../signals/bot"
import notificationSignals from "../signals/notification"
import panelSignals from "../signals/panel"
import userSignals from "../signals/user"
import routeSignals from "../signals/route"
import wireSignals from "../signals/wire"
import { ComponentProperty } from "../properties/componentproperty"
import { getComponentDef } from "./stateapi"

const signalDefinitionRegistry: Record<string, SignalDescriptor> = {
	...aiSignals,
	...collectionSignals,
	...botSignals,
	...routeSignals,
	...userSignals,
	...wireSignals,
	...panelSignals,
	...notificationSignals,
}

type SignalOutput = {
	name: string
	type: "TEXT" | "RECORD" | "MAP" | "LIST"
}

type SignalDescriptor = {
	label: string
	description: string
	properties: (
		signal: SignalDefinition,
		context: context.Context
	) => ComponentProperty[]
	outputs?: SignalOutput[]
}

type ComponentSignalDescriptor = {
	label?: string
	properties?: (
		signal: SignalDefinition,
		context: context.Context
	) => ComponentProperty[]
	target?: string
	outputs?: SignalOutput[]
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

type SelectOptionFilter = (option: wire.SelectOption) => boolean

const getDefaultSignalProperties = (
	optionsFilter?: SelectOptionFilter
): ComponentProperty[] =>
	[
		{
			name: "signal",
			label: "Signal",
			type: "SELECT",
			options: collection.addBlankSelectOption(
				optionsFilter ? allSignals.filter(optionsFilter) : allSignals
			),
		},
	] as ComponentProperty[]

const stepIdProperty = {
	name: "stepId",
	label: "Step Id",
	type: "TEXT",
} as ComponentProperty

const COMPONENT_SIGNAL_PREFIX = "COMPONENT/"

const getSignalProperties = (
	signalPlainWireRecord: wire.PlainWireRecord,
	context: context.Context
): ComponentProperty[] => {
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
	// If the user doesn't have permission to use AI signals, strip these out
	let optionsFilter = undefined
	const useAiSignalsFlag = context.getFeatureFlag("use_ai_signals")
	if (!useAiSignalsFlag || !useAiSignalsFlag.value) {
		optionsFilter = (option: wire.SelectOption) =>
			!option.value.startsWith("ai/")
	}

	return [
		...getDefaultSignalProperties(optionsFilter),
		...(descriptor && descriptor.outputs?.length ? [stepIdProperty] : []),
		...(descriptor && descriptor.properties
			? descriptor.properties(signalDefinition, context)
			: []),
	]
}

export { getSignalProperties }

export type {
	SignalDefinition,
	SignalDescriptor,
	SignalOutput,
	ComponentSignalDescriptor,
}
