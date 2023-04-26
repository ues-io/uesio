import { WireDefault } from "../bands/wire/defaults/defaults"
import {
	FieldType,
	NumberMetadata,
	ReferenceMetadata,
	SelectListMetadata,
} from "../bands/field/types"
import { SignalDefinition } from "./signal"
import { WireConditionState } from "../bands/wire/conditions/conditions"
import { MetadataKey } from "../bands/builder/types"
import { DisplayCondition } from "../componentexports"
type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type ViewOnlyField = {
	label: string
	required: boolean
	type: FieldType // get better type
	reference?: ReferenceMetadata
	selectlist?: SelectListMetadata
	number?: NumberMetadata
	fields?: Record<string, ViewOnlyField>
}

type RegularField = {
	id: string
	fields: WireFieldDefinitionMap
}

type OnChangeEvent = {
	field: string
	signals: SignalDefinition[]
}

// Todo: add all wire signal types
type WireEventType =
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
	fields: Record<string, ViewOnlyField>
}

type RegularWireDefinition = WireDefinitionBase & {
	viewOnly?: false
	fields: WireFieldDefinitionMap
	collection: string
	order?: WireOrderDescription[]
	batchsize?: number
	conditions?: WireConditionState[]
	requirewriteaccess?: boolean
	loadAll?: boolean
}

type WireDefinition = ViewOnlyWireDefinition | RegularWireDefinition

type WireFieldDefinitionMap = {
	[key: string]: WireFieldDefinition
}

type WireFieldDefinition = RegularField | undefined | null

type WireOrderDescription = {
	field: MetadataKey
	desc: boolean
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
