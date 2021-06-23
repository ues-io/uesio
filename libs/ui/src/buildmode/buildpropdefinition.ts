import { DefinitionMap } from "../definition/definition"
import { Uesio } from "../hooks/hooks"
import { definition } from "@uesio/ui"
import { MetadataType } from "../bands/builder/types"

type BuildPropertiesDefinition = {
	title: string
	properties?: PropDescriptor[]
	sections: PropertySection[]
	actions?: ActionDescriptor[]
	defaultDefinition: () => DefinitionMap
	signals?: SignalProperties[]
	traits?: string[]
	handleFieldDrop?: (
		dragNode: string,
		dropNode: string,
		dropIndex: number,
		propDef: BuildPropertiesDefinition,
		uesio: Uesio
	) => void
	name?: string // auto-populated
	namespace?: string // auto-populated
	type?: string
}

type PropertySection =
	| FieldsSection
	| ConditionsSection
	| SignalsSection
	| PropListSection
	| StylesSection

type BasePropSection = {
	title: string
	type: string
}

interface FieldsSection extends BasePropSection {
	type: "FIELDS"
}

interface ConditionsSection extends BasePropSection {
	type: "CONDITIONS"
}

interface SignalsSection extends BasePropSection {
	type: "SIGNALS"
}

interface PropListSection extends BasePropSection {
	type: "PROPLIST"
	properties: PropDescriptor[]
}

interface StylesSection extends BasePropSection {
	type: "STYLES"
}

type PropDescriptor =
	| TextProp
	| NumberProp
	| SelectProp
	| BooleanProp
	| MetadataProp
	| MultiSelectProp
	| KeyProp
	| WireProp
	| BotProp
	| WiresProp
	| ConditionProp
	| NamespaceProp
	| ComponentTargetProp

type BasePropDescriptor = {
	//TODO:: Needs placeholder text
	name: string
	type: string
	label: string
}

interface DefinitionBasedPropDescriptor extends BasePropDescriptor {
	filter?: (def: definition.Definition, id: string) => boolean
}

interface ConditionProp extends DefinitionBasedPropDescriptor {
	type: "CONDITION"
	wire?: string
}

interface NamespaceProp extends BasePropDescriptor {
	type: "NAMESPACE"
}

interface TextProp extends BasePropDescriptor {
	type: "TEXT"
}

interface NumberProp extends BasePropDescriptor {
	type: "NUMBER"
}

interface MetadataProp extends BasePropDescriptor {
	type: "METADATA"
	metadataType: MetadataType
	groupingParents?: number
	groupingProperty?: string
	getGroupingFromKey?: boolean
}

interface BotProp extends BasePropDescriptor {
	type: "BOT"
	botType: "LISTENER"
	namespace?: string
}
interface SelectProp extends BasePropDescriptor {
	type: "SELECT"
	options: PropertySelectOption[]
}

interface BooleanProp extends BasePropDescriptor {
	type: "BOOLEAN"
	displaytype?: "checkbox" | "switch" | "select"
}

interface MultiSelectProp extends BasePropDescriptor {
	type: "MULTISELECT"
	options: PropertySelectOption[]
}

interface KeyProp extends BasePropDescriptor {
	type: "KEY"
}

interface WireProp extends DefinitionBasedPropDescriptor {
	type: "WIRE"
}

interface WiresProp extends BasePropDescriptor {
	type: "WIRES"
}

interface ComponentTargetProp extends BasePropDescriptor {
	type: "COMPONENT"
	scope: string
}

type ActionDescriptor =
	| AddAction
	| RunSignalsAction
	| LoadWireAction
	| ToggleConditionAction

type AddAction = {
	label: string
	type: "ADD"
	componentKey: string
	slot: string
}

type LoadWireAction = {
	label: string
	type: "LOAD_WIRE"
}

type ToggleConditionAction = {
	label: string
	type: "TOGGLE_CONDITION"
}

type RunSignalsAction = {
	label: string
	type: "RUN_SIGNALS"
	slot: string
}

type PropertySelectOption = {
	value: string
	label: string
}

type SignalProperties = {
	name: string
}

export {
	BuildPropertiesDefinition,
	PropertySection,
	PropDescriptor,
	PropertySelectOption,
	ActionDescriptor,
	AddAction,
	RunSignalsAction,
	LoadWireAction,
	TextProp,
	NumberProp,
	MetadataProp,
	SelectProp,
	BooleanProp,
	BotProp,
	MultiSelectProp,
	KeyProp,
	WireProp,
	WiresProp,
	ComponentTargetProp,
	FieldsSection,
	StylesSection,
	ConditionsSection,
	SignalsSection,
	PropListSection,
}
