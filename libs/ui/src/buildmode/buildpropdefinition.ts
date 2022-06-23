import {
	BaseProps,
	Definition,
	DefinitionMap,
	DefinitionValue,
} from "../definition/definition"
import { Uesio } from "../hooks/hooks"
import { MetadataType } from "../bands/builder/types"
import { FunctionComponent } from "react"
import ValueAPI from "./valueapi"

type BuildPropertiesDefinition = {
	title: string
	description?: string
	link?: string
	properties?: PropDescriptor[]
	sections: PropertySection[]
	actions?: ActionDescriptor[]
	defaultDefinition: () => DefinitionMap
	signals?: SignalProperties[]
	traits?: string[]
	accepts?: string[]
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
	classes?: string[]
}

type PropertySection =
	| FieldsSection
	| ConditionsSection
	| SignalsSection
	| PropListSection
	| StylesSection
	| OrderSection
	| ConditionalDisplaySection

type BasePropSection = {
	title: string
	type: string
}

interface FieldsSection extends BasePropSection {
	type: "FIELDS"
}

interface OrderSection extends BasePropSection {
	type: "ORDER"
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
interface ConditionalDisplaySection extends BasePropSection {
	type: "CONDITIONALDISPLAY"
}

type PropDescriptor =
	| TextProp
	| NumberProp
	| CustomProp
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
	| ConditionalDisplayProp
	| IconProp

type BasePropDescriptor = {
	//TODO:: Needs placeholder text
	name: string
	type: string
	label: string
	display?: DisplayCondition[]
}

type DisplayCondition = {
	property: string
} & (
	| { values: DefinitionValue[]; value?: never }
	| { value: DefinitionValue; values?: never }
)

interface DefinitionBasedPropDescriptor extends BasePropDescriptor {
	filter?: (def: Definition, id: string) => boolean
}

interface CustomPropRendererProps extends PropRendererProps {
	descriptor: CustomProp
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

interface IconProp extends BasePropDescriptor {
	type: "ICON"
}

interface ConditionalDisplayProp extends BasePropDescriptor {
	type: "CONDITIONALDISPLAY"
}

interface NumberProp extends BasePropDescriptor {
	type: "NUMBER"
}

interface CustomProp extends BasePropDescriptor {
	type: "CUSTOM"
	renderFunc: FunctionComponent<CustomPropRendererProps>
}

interface MetadataProp extends BasePropDescriptor {
	type: "METADATA"
	metadataType: MetadataType
	groupingValue?: string
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
	| CloneAction
	| DeleteAction
	| MoveAction
	| AddCondition

type AddCondition = {
	label: string
	type: "ADD_CONDITION"
	path: string
	definition: Definition
	logo: string
}

type AddAction = {
	label: string
	type: "ADD"
	componentKey: string
	slot: string
}

type DeleteAction = {
	type: "DELETE"
}

type MoveAction = {
	type: "MOVE"
}

type CloneAction = {
	type: "CLONE"
}

type LoadWireAction = {
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

interface PropRendererProps extends BaseProps {
	descriptor: PropDescriptor
	propsDef: BuildPropertiesDefinition
	valueAPI: ValueAPI
}

export {
	DisplayCondition,
	ValueAPI,
	PropRendererProps,
	CustomPropRendererProps,
	BuildPropertiesDefinition,
	PropertySection,
	PropDescriptor,
	PropertySelectOption,
	ActionDescriptor,
	AddAction,
	CloneAction,
	RunSignalsAction,
	LoadWireAction,
	TextProp,
	IconProp,
	NumberProp,
	CustomProp,
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
	ConditionalDisplayProp,
	OrderSection,
	AddCondition,
}
