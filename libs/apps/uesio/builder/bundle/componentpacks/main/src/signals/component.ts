import { context, wire } from "@uesio/ui"
import {
	SignalBandDefinition,
	SignalDefinition,
	SignalDescriptor,
} from "../api/signalsapi"

import {
	getComponentDefs,
	getComponentDef,
	getComponentIdsOfType,
} from "../api/stateapi"
import { ComponentProperty } from "../properties/componentproperty"

const getComponentTypesWithSignals = (context: context.Context) => {
	const defs = Object.entries(getComponentDefs(context) || {}).filter(
		([, def]) => def.signals !== undefined
	)
	defs.sort(([, a], [, b]) => a.title.localeCompare(b.title))
	return defs
}
const getComponentSignalOptions = (
	context: context.Context,
	componentType: string
): wire.SelectOption[] => {
	if (componentType) {
		const componentDef = getComponentDef(context, componentType)
		if (componentDef?.signals) {
			const entries = Object.entries(componentDef.signals)
			entries.sort(([aName, a], [bName, b]) =>
				(a.label || aName).localeCompare(b.label || bName)
			)
			return entries.map(([name, def]) => ({
				value: name,
				label: def.label || name,
				title: def.description,
			})) as wire.SelectOption[]
		}
	}
	return [
		{
			value: "",
			disabled: true,
			label: "",
		},
	] as wire.SelectOption[]
}

const getComponentIds = (
	context: context.Context,
	componentType: string
): wire.SelectOption[] => {
	if (componentType) {
		return getComponentIdsOfType(context, componentType).map(
			(id: string) => ({
				value: id,
				label: id,
			})
		)
	}
	return [
		{
			value: "",
			disabled: true,
			label: "(No Component type selected)",
		},
	] as wire.SelectOption[]
}

type ComponentSignalDefinition = {
	signal: "component/CALL"
	component: string
	componentsignal: string
	targettype: "specific" | "multiple"
	target?: string
	componentid: string
} & SignalDefinition

// The key for the entire band
const BAND = "component"
const signals: SignalBandDefinition = {
	band: BAND,
	label: "Component",
	signals: {
		[`${BAND}/CALL`]: {
			label: "Run Component Signal",
			description:
				"Invokes a Component-defined Signal on one or more instances of that Component",
			properties: (signal: ComponentSignalDefinition, context) => {
				const baseProperties = [
					{
						type: "SELECT",
						name: "component",
						label: "Component Type",
						options: getComponentTypesWithSignals(context).map(
							([type, def]) => ({
								value: type,
								label: def.title,
							})
						),
						blankOptionLabel: "Select...",
					},
					{
						type: "SELECT",
						name: "componentsignal",
						label: "Component Signal",
						options: getComponentSignalOptions(
							context,
							signal.component as string
						),
						blankOptionLabel: "Select...",
					},
					// Once a specific Component Type is selected, you then get to choose a "Run Signal for which components?" option,
					// which has two choices: (A) "All components whose id contains..." which then gives you a "Target" text box,
					// OR (B) "Specific Component" , which then gives you a Select which lets you pick a specific Component by its Component Id .
					// ONLY Components with a Component Id ("uesio.id" property) would be displayed here.
					{
						type: "SELECT",
						options: [
							{
								value: "specific",
								label: "Specific Component",
							},
							{
								value: "multiple",
								label: "All components whose id contains...",
							},
						],
						name: "targettype",
						label: "Run Signal for which components?",
						blankOptionLabel: "Select...",
					},
					{
						type: "SELECT",
						options: getComponentIds(context, signal.component),
						name: "componentid",
						label: "Component Id",
						blankOptionLabel: "Select Component...",
						displayConditions: [
							{
								field: "targettype",
								value: "specific",
								type: "fieldValue",
							},
						],
					},
					{
						type: "TEXT",
						name: "target",
						label: "Components Selector",
						displayConditions: [
							{
								field: "targettype",
								value: "multiple",
								type: "fieldValue",
							},
						],
					},
				] as ComponentProperty[]

				// Append signal-specific properties, if there are any
				const signalProperties = (
					signal.component && signal.componentsignal
						? getComponentDef(context, signal.component)?.signals?.[
								signal.componentsignal
						  ]?.properties
						: []
				) as ComponentProperty[]

				return signalProperties
					? baseProperties.concat(signalProperties)
					: baseProperties
			},
			// Signal-defined outputs
			// outputs: [{ name: "result", type: "MAP" }],
		},
	} as Record<string, SignalDescriptor>,
}
export default signals
