import { WireDefault } from "../bands/wire/defaults/defaults"
import { FieldType, ReferenceMetadata } from "../bands/field/types"
import { SignalDefinition } from "./signal"
import { WireConditionState } from "../bands/wire/conditions/conditions"
import { MetadataKey } from "../bands/builder/types"
type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type ViewOnlyField = {
	label: string
	required: boolean
	type: FieldType // get better type
	reference?: ReferenceMetadata
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

type WireEvents = {
	onChange: OnChangeEvent[]
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

export {
	WireDefinition,
	WireDefinitionMap,
	WireEvents,
	WireFieldDefinition,
	WireFieldDefinitionMap,
	RegularWireDefinition,
	ViewOnlyWireDefinition,
	ViewOnlyField,
}
