import type { WireDefault } from "../bands/wire/defaults/defaults"
import type {
	FieldType,
	NumberMetadata,
	ReferenceMetadata,
	SelectListMetadata,
} from "../bands/field/types"
import type { SignalDefinition } from "./signal"
import type { WireConditionState } from "../bands/wire/conditions/conditions"
import type { MetadataKey } from "../metadata/types"
import type { DisplayCondition } from "../componentexports"
import { CollectionFieldKey, CollectionKey } from "../bands/wire/types"
type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type ViewOnlyField = {
	type: FieldType
	subtype?: FieldType // For STRUCT/LIST/MAP types
	label?: string
	required?: boolean
	reference?: ReferenceMetadata
	selectlist?: SelectListMetadata
	number?: NumberMetadata
	fields?: Record<string, ViewOnlyField>
	viewOnly?: boolean
}

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
	init?: {
		query?: boolean
		create?: boolean
	}
	viewOnly?: boolean
	events?: WireEvents
}

type ViewOnlyWireDefinition = WireDefinitionBase & {
	viewOnly: true
	label?: string
	pluralLabel?: string
	fields: Record<string, ViewOnlyField>
}

type RegularWireDefinition = WireDefinitionBase & {
	viewOnly?: false
	fields?: WireFieldDefinitionMap
	/**
	 * @minLength 2
	 */
	collection: CollectionKey
	order?: WireOrderDescription[]
	/**
	 * @minimum 0
	 */
	batchsize?: number
	conditions?: WireConditionState[]
	requirewriteaccess?: boolean
	loadAll?: boolean
}

type WireDefinition = ViewOnlyWireDefinition | RegularWireDefinition

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
	ViewOnlyField,
}
