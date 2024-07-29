import { collection, signal, context, wire } from "@uesio/ui"
import collectionSignals from "../signals/collection"
import componentSignals from "../signals/component"
import botSignals from "../signals/bot"
import integrationSignals from "../signals/integration"
import notificationSignals from "../signals/notification"
import panelSignals from "../signals/panel"
import userSignals from "../signals/user"
import toolsSignals from "../signals/tools"
import routeSignals from "../signals/route"
import wireSignals from "../signals/wire"
import { ComponentProperty } from "../properties/componentproperty"
import { getComponentDef } from "./stateapi"

const signalBandDefinitions: SignalBandDefinition[] = [
	// Ordered by perceived utility, not alphabetically. Up for debate as to which is better
	wireSignals,
	notificationSignals,
	panelSignals,
	routeSignals,
	botSignals,
	integrationSignals,
	toolsSignals,
	componentSignals,
	collectionSignals,
	userSignals,
]

type SignalOutput = {
	name: string
	type: "TEXT" | "RECORD" | "MAP" | "LIST" | "STRUCT"
}

type SignalBandDefinition = {
	band: string
	label: string
	signals: Record<string, SignalDescriptor>
}

type SignalDescriptor = {
	label: string
	description: string
	properties: (
		signal: signal.SignalDefinition,
		context: context.Context
	) => ComponentProperty[]
	outputs?: SignalOutput[]
	canError?: boolean
	disabled?: boolean
}

type ComponentSignalDescriptor = {
	label?: string
	properties?: (
		signal: signal.SignalDefinition,
		context: context.Context
	) => ComponentProperty[]
	target?: string
	outputs?: SignalOutput[]
}

const signalDescriptorsIndex = {} as Record<string, SignalDescriptor>

const allSignalSelectOptions = signalBandDefinitions
	.map(({ band, label, signals }) => {
		const bandSignals = Object.entries(signals).map(
			([signal, signalDescriptor]) => {
				const { label, description, disabled } = signalDescriptor
				// Add an index while we're here
				signalDescriptorsIndex[signal] = signalDescriptor
				// Construct a select option
				return {
					value: signal,
					label: label || signal,
					title: description || signal,
					disabled,
				} as wire.SelectOption
			}
		) as wire.SelectOption[]
		bandSignals.sort((a, b) => a.label.localeCompare(b.label))
		return {
			title: label || band,
			label,
			options: bandSignals,
		} as wire.SelectOption
	})
	.flat()

const getDefaultSignalProperties = (): ComponentProperty[] =>
	[
		{
			name: "signal",
			label: "Signal",
			type: "SELECT",
			options: collection.addBlankSelectOption(allSignalSelectOptions),
		},
	] as ComponentProperty[]

const stepIdProperty = {
	name: "stepId",
	label: "Step Id",
	type: "TEXT",
} as ComponentProperty

const onErrorProperty = {
	name: "onerror",
	label: "Error handling",
	type: "STRUCT",
	properties: [
		{
			name: "continue",
			label: "Continue running other signals on error",
			type: "CHECKBOX",
		},
		{
			name: "notify",
			label: "Display default notification on error",
			type: "CHECKBOX",
		},
		// TODO: Add support for on-error signals property category
		// {
		// 	name: "signals",
		// 	label: "On-Error Signals",
		// 	type: "SIGNALS",
		// },
	],
} as ComponentProperty

const COMPONENT_SIGNAL_PREFIX = "COMPONENT/"

const getSignalProperties = (
	signalPlainWireRecord: wire.PlainWireRecord,
	context: context.Context
): ComponentProperty[] => {
	const signalDefinition = signalPlainWireRecord as signal.SignalDefinition
	const signalName = signalDefinition?.signal
	let descriptor = signalDescriptorsIndex[signalName]
	// Load Component-specific signal definitions dynamically from Component definition
	if (
		!descriptor &&
		signalName &&
		signalName.startsWith(COMPONENT_SIGNAL_PREFIX)
	) {
		const cmpSignalParts = signalName
			.substring(COMPONENT_SIGNAL_PREFIX.length)
			.split("/")
		if (cmpSignalParts.length === 3) {
			const cmpSignalName = cmpSignalParts.pop() as string
			const componentDef = getComponentDef(cmpSignalParts.join("/"))
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
		...getDefaultSignalProperties(),
		...(descriptor && descriptor.outputs?.length ? [stepIdProperty] : []),
		...(descriptor && descriptor.properties
			? descriptor.properties(signalDefinition, context)
			: []),
		...(descriptor && descriptor.canError ? [onErrorProperty] : []),
	]
}

export { getSignalProperties }

export type {
	SignalBandDefinition,
	SignalDescriptor,
	SignalOutput,
	ComponentSignalDescriptor,
}
