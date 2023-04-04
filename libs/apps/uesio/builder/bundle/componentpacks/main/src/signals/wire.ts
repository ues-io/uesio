import { wire } from "@uesio/ui"

import { SignalDefinition, SignalDescriptor } from "../api/signalsapi"
import { ComponentProperty } from "../properties/componentproperty"

// The key for the entire band
const WIRE_BAND = "wire"

interface ToggleConditionSignal extends SignalDefinition {
	wire: string
	conditionId: string
}

interface RemoveConditionSignal extends SignalDefinition {
	wire: string
	conditionId: string
}

interface SetConditionValueSignal extends SignalDefinition {
	wire: string
	value: string | number | boolean
	conditionId: string
}

const getWiresWith = (key: "conditions" | "order") =>
	({
		name: "wire",
		type: "WIRE",
		filter: (def: wire.RegularWireDefinition) => def && !!def[key]?.length,
		label: "Wire",
	} as ComponentProperty)

const getConditionIdsDescriptor = (wire: string): ComponentProperty => ({
	name: "conditionId",
	type: "CONDITION",
	filter: (def: wire.WireConditionState) => !!def.id,
	wire,
	label: "condition",
})

const getWireAndConditionsDescriptor = (wire: string) => [
	getWiresWith("conditions"),
	getConditionIdsDescriptor(wire),
]

// Metadata for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${WIRE_BAND}/TOGGLE_DELETE_STATUS`]: {
		label: "Toggle delete status",
		description: "Toggle the delete status of a wire",
		properties: () => [],
	},
	[`${WIRE_BAND}/MARK_FOR_DELETE`]: {
		label: "Mark For Delete",
		description: "Mark for delete",
		properties: () => [],
	},
	[`${WIRE_BAND}/UNMARK_FOR_DELETE`]: {
		label: "Unmark For Delete",
		description: "Unmark for delete",
		properties: () => [],
	},
	[`${WIRE_BAND}/CREATE_RECORD`]: {
		label: "Create Record",
		description: "Creates a new record on a wire",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
		outputs: [
			{ name: "record", type: "RECORD" },
			{ name: "recordId", type: "TEXT" },
		],
	},
	[`${WIRE_BAND}/UPDATE_RECORD`]: {
		label: "Update Record",
		description: "update record",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "field",
				type: "FIELD",
				label: "Field",
				wireField: "wire",
			},
			{
				name: "value",
				type: "TEXT",
				label: "Value",
			},
		],
	},
	[`${WIRE_BAND}/CANCEL`]: {
		label: "Cancel Wire Changes",
		description: "Cancel all wire changes",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
	},
	[`${WIRE_BAND}/EMPTY`]: {
		label: "Empty Wire",
		description: "Empty wire",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
	},
	[`${WIRE_BAND}/RESET`]: {
		label: "Reset Wire",
		description: "Reset wire",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
	},
	[`${WIRE_BAND}/SEARCH`]: {
		label: "Search Wire",
		description: "Search wire",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "searchFields",
				type: "FIELDS",
				label: "Search Fields",
				wireField: "wire",
			},
			{
				name: "search",
				type: "TEXT",
				label: "Search",
			},
		],
	},
	[`${WIRE_BAND}/TOGGLE_CONDITION`]: {
		label: "Toggle Wire Condition",
		description: "Toggle wire condition",
		properties: (signal: ToggleConditionSignal): ComponentProperty[] => [
			...getWireAndConditionsDescriptor(<string>signal.wire),
		],
	},

	[`${WIRE_BAND}/SET_CONDITION_VALUE`]: {
		label: "Set Wire Condition value",
		description: "Set the value of the wire condition",
		properties: (signal: SetConditionValueSignal): ComponentProperty[] => [
			...getWireAndConditionsDescriptor(<string>signal.wire),
			{
				name: "value",
				type: "TEXT",
				label: "value",
			},
		],
	},
	[`${WIRE_BAND}/SET_CONDITION`]: {
		label: "Set Wire Condition",
		description: "Set wire condition",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
	},
	[`${WIRE_BAND}/REMOVE_CONDITION`]: {
		label: "Remove Wire Condition",
		description: "Remove wire condition",
		properties: (signal: RemoveConditionSignal): ComponentProperty[] => [
			...getWireAndConditionsDescriptor(<string>signal.wire),
		],
	},
	[`${WIRE_BAND}/SET_ORDER`]: {
		label: "Set Wire Order",
		description: "Removes previous order and sets the new one",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "field",
				type: "FIELD",
				label: "Field",
				wireField: "wire",
			},
			{
				name: "desc",
				type: "CHECKBOX",
				label: "Descending",
			},
		],
	},
	[`${WIRE_BAND}/ADD_ORDER`]: {
		label: "Add Wire Order",
		description: "appends new order to the wire",
		properties: (): ComponentProperty[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "field",
				type: "FIELD",
				label: "Field",
				wireField: "wire",
			},
			{
				name: "desc",
				type: "CHECKBOX",
				label: "Descending",
			},
		],
	},
	[`${WIRE_BAND}/REMOVE_ORDER`]: {
		label: "Remove Wire Order",
		description: "Remove wire order",
		properties: (): ComponentProperty[] => [
			getWiresWith("order"),
			{
				name: "fields",
				type: "FIELD",
				label: "Field",
				wireField: "wire",
			},
		],
	},
	[`${WIRE_BAND}/INIT`]: {
		label: "Init Wire(s)",
		description: "Init wire(s)",
		properties: (): ComponentProperty[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
	[`${WIRE_BAND}/LOAD`]: {
		label: "Load Wire(s)",
		description: "Load wire(s)",
		properties: (): ComponentProperty[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
	[`${WIRE_BAND}/LOAD_NEXT_BATCH`]: {
		label: "Load Next Batch",
		description: "Load next batch",
		properties: (): ComponentProperty[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
	[`${WIRE_BAND}/LOAD_ALL`]: {
		label: "Load All",
		description: "Load all",
		properties: (): ComponentProperty[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
	[`${WIRE_BAND}/SAVE`]: {
		label: "Save Wire(s)",
		description: "Save wire(s)",
		properties: (): ComponentProperty[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
}

export default signals
