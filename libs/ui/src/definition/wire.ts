import type { WireDefault } from "../bands/wire/defaults/defaults"
import type {
	FieldType,
	MetadataFieldMetadata,
	NumberMetadata,
	ReferenceMetadata,
} from "../bands/field/types"
import { SelectListMetadata } from "./selectlist"
import type { SignalDefinition } from "./signal"
import type { WireConditionState } from "../bands/wire/conditions/conditions"
import type { MetadataKey } from "../metadata/types"
import type { DisplayCondition } from "../componentexports"
import { CollectionFieldKey, CollectionKey } from "../bands/wire/types"
type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type ViewOnlySelectListMetadata = {
	source?: "local" | ""
} & SelectListMetadata

type ViewOnlyField = {
	type: FieldType
	subtype?: FieldType // For STRUCT/LIST/MAP types
	label?: string
	required?: boolean
	reference?: ReferenceMetadata
	selectlist?: ViewOnlySelectListMetadata
	number?: NumberMetadata
	metadata?: MetadataFieldMetadata
	fields?: Record<string, ViewOnlyField>
	viewOnly?: boolean
	createable?: boolean
	updateable?: boolean
}

type AggregateField = {
	function: "SUM" | "COUNT" | "MAX" | "MIN"
}

type GroupByField = {
	function?: "DATE_TRUNC_MONTH" | "DATE_TRUNC_DAY" | undefined | null
} | null

type RegularField = {
	fields?: WireFieldDefinitionMap
}

type OnChangeEvent = {
	field: string
	signals: SignalDefinition[]
}

// Todo: add all wire signal types
type WireEventType =
	| "onLoadError"
	| "onLoadSuccess"
	| "onSaveSuccess"
	| "onSaveError"
	| "onChange"
	| "onCancel"

type WireEvents =
	| {
			onChange: OnChangeEvent[]
	  }
	| WireEvent[]

type WireEvent<T = WireEventType> =
	| {
			type: "onChange"
			fields?: string[]
			conditions?: DisplayCondition[]
			signals?: SignalDefinition[]
	  }
	| {
			type: Exclude<T, "onChange">
			signals?: SignalDefinition[]
			conditions?: DisplayCondition[]
	  }

type WireDefinitionBase = {
	defaults?: WireDefault[]
	events?: WireEvents
	init?: {
		query?: boolean
		create?: boolean
	}
	viewOnly?: boolean
	aggregate?: boolean
}

type AggregateWireDefinition = WireDefinitionBase & {
	aggregate: true
	viewOnly?: false
	/**
	 * @minLength 2
	 */
	collection: CollectionKey
	conditions?: WireConditionState[]
	fields?: Record<string, AggregateField>
	groupby?: Record<string, GroupByField>
}

type ViewOnlyWireDefinition = WireDefinitionBase & {
	aggregate?: false
	fields: Record<string, ViewOnlyField>
	label?: string
	pluralLabel?: string
	nameField?: string
	viewOnly: true
}

type RegularWireDefinition = WireDefinitionBase & {
	aggregate?: false
	/**
	 * @minimum 0
	 */
	batchsize?: number
	/**
	 * @minLength 2
	 */
	collection: CollectionKey
	conditions?: WireConditionState[]
	fields?: WireFieldDefinitionMap
	loadAll?: boolean
	order?: WireOrderDescription[]
	requirewriteaccess?: boolean
	viewOnly?: false
}

type WireDefinition =
	| ViewOnlyWireDefinition
	| RegularWireDefinition
	| AggregateWireDefinition

type WireFieldDefinitionMap = {
	[key: CollectionFieldKey]: WireFieldDefinition | ViewOnlyField
}

type WireFieldDefinition = RegularField | undefined | null

type WireOrderDescription = {
	field: MetadataKey
	desc?: boolean
}

export type {
	WireDefault,
	WireDefinition,
	WireDefinitionMap,
	WireEvents,
	WireEvent,
	WireEventType,
	WireFieldDefinition,
	WireFieldDefinitionMap,
	RegularWireDefinition,
	ViewOnlyWireDefinition,
	AggregateWireDefinition,
	ViewOnlyField,
	AggregateField,
	GroupByField,
}
