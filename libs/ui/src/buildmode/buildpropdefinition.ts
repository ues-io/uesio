import {
	BaseProps,
	Definition,
	DefinitionMap,
	DefinitionValue,
} from "../definition/definition"
import React, { FC } from "react"
import { Uesio } from "../hooks/hooks"
import { MetadataType } from "../bands/builder/types"
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
	category?: Categories
}

type Categories =
	| "LAYOUT"
	| "CONTENT"
	| "DATA"
	| "INTERACTION"
	| "VISUALIZATION"
	| "UNCATEGORIZED"

type PropertySection =
	| FieldsSection
	| ConditionsSection
	| SignalsSection
	| PropListSection
	| PropListsSection
	| StylesSection
	| CustomSection
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
interface PropListsSection extends BasePropSection {
	name: string
	type: "PROPLISTS"
	properties: PropDescriptor[]
	nameTemplate: string
	nameFallback: string
	defaultDefinition?: () => Definition
}

interface StylesSection extends BasePropSection {
	type: "STYLES"
}

// Duplicate code from the studio
interface SectionRendererProps extends BaseProps {
	section: PropertySection
	propsDef: BuildPropertiesDefinition
	valueAPI: ValueAPI
}
interface CustomSection extends BasePropSection {
	type: "CUSTOM"
	renderFunc: FC<SectionRendererProps>
}
interface ConditionalDisplaySection extends BasePropSection {
	type: "CONDITIONALDISPLAY"
}

type PropDescriptor =
	| TextProp
	| TextAreaProp
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
	| ParamProp
	| ParamsProp
	| WireFieldsProp
	| FieldProp
	| PropListProp

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
	| {
			type?: "EQUALS" | "NOT_EQUALS"
			value: DefinitionValue
	  }
	| { type: "INCLUDES"; values: DefinitionValue[] }
	| {
			type: "BLANK" | "NOT_BLANK" | "SET" | "NOT_SET"
	  }
)

interface DefinitionBasedPropDescriptor extends BasePropDescriptor {
	filter?: (def: Definition, id: string) => boolean
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

interface TextAreaProp extends BasePropDescriptor {
	type: "TEXT_AREA"
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
interface ParamProp extends DefinitionBasedPropDescriptor {
	type: "PARAM"
}
interface ParamsProp extends BasePropDescriptor {
	type: "PARAMS"
}

interface CustomProp extends BasePropDescriptor {
	type: "CUSTOM"
	renderFunc: PropComponent<CustomProp>
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

interface WireFieldsProp extends BasePropDescriptor {
	type: "WIRE_FIELDS"
}
interface FieldProp extends BasePropDescriptor {
	type: "FIELD"
	wireField: string
}
interface PropListProp extends BasePropDescriptor {
	type: "PROPLISTS"
	properties: PropDescriptor[]
	nameTemplate: string
}
type ActionDescriptor =
	| AddAction
	| CustomAction
	| RunSignalsAction
	| LoadWireAction
	| ToggleConditionAction
	| CloneAction
	| CloneKeyAction
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

type CustomAction = {
	type: "CUSTOM"
	handler: (e: React.SyntheticEvent<Element, Event>) => void
	label: string
	icon: string
	disabled?: boolean
}

type MoveAction = {
	type: "MOVE"
}

type CloneAction = {
	type: "CLONE"
}

type CloneKeyAction = {
	type: "CLONEKEY"
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
	disabled?: boolean
}

type SignalProperties = {
	name: string
}

interface PropRendererProps<T = PropDescriptor> extends BaseProps {
	descriptor: T
	propsDef: BuildPropertiesDefinition
	valueAPI: ValueAPI
}

type PropComponent<T = PropDescriptor> = FC<PropRendererProps<T>>

export {
	PropComponent,
	NamespaceProp,
	ConditionProp,
	ParamsProp,
	SectionRendererProps,
	DisplayCondition,
	ValueAPI,
	PropRendererProps,
	BuildPropertiesDefinition,
	PropertySection,
	PropDescriptor,
	PropertySelectOption,
	ActionDescriptor,
	AddAction,
	CustomAction,
	CloneAction,
	RunSignalsAction,
	LoadWireAction,
	TextProp,
	TextAreaProp,
	IconProp,
	NumberProp,
	CustomProp,
	MetadataProp,
	SelectProp,
	BooleanProp,
	BotProp,
	MultiSelectProp,
	ParamProp,
	KeyProp,
	WireProp,
	WiresProp,
	ComponentTargetProp,
	FieldsSection,
	StylesSection,
	ConditionsSection,
	SignalsSection,
	PropListSection,
	PropListsSection,
	ConditionalDisplayProp,
	OrderSection,
	WireFieldsProp,
	PropListProp,
	AddCondition,
	FieldProp,
}
