import { collection, component, context, definition, wire } from "@uesio/ui"
import collectionSignals from "../signals/collection"
import componentSignals from "../signals/component"
import aiSignals from "../signals/ai"
import botSignals from "../signals/bot"
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
	// TODO: Should we hide Bot signals if users don't have Bot feature flag activated?
	botSignals,
	toolsSignals,
	componentSignals,
	collectionSignals,
	userSignals,
	aiSignals,
]

type SignalOutput = {
	name: string
	type: "TEXT" | "RECORD" | "MAP" | "LIST"
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
		signal: SignalDefinition,
		context: context.Context
	) => ComponentProperty[]
	outputs?: SignalOutput[]
	canError?: boolean
	disabled?: boolean
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
	[component.COMPONENT_CONTEXT]?: context.ContextOptions
	stepId?: string
	onerror?: {
		continue: boolean
		notify: boolean
		signals: SignalDefinition[]
	}
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
				optionsFilter
					? allSignalSelectOptions.filter(optionsFilter)
					: allSignalSelectOptions
			),
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
	const signalDefinition = signalPlainWireRecord as SignalDefinition
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
		...(descriptor && descriptor.canError ? [onErrorProperty] : []),
	]
}

export { getSignalProperties }

export type {
	SignalBandDefinition,
	SignalDefinition,
	SignalDescriptor,
	SignalOutput,
	ComponentSignalDescriptor,
}
