import { WireConditionDefinition } from "../bands/wire/conditions/conditions"
import { WireDefault } from "../bands/wire/defaults/defaults"
import { FieldType } from "../bands/field/types"
type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type ViewOnlyField = {
	label: string
	required: boolean
	type: FieldType // get better type
}

type WireDefinitionBase = {
	defaults?: WireDefault[]
	init?: {
		query?: boolean
		create?: boolean
	}
	viewOnly?: boolean
}

type ViewOnlyWireDefinition = WireDefinitionBase & {
	viewOnly: true
	fields: Record<string, ViewOnlyField>
}

type RegularWireDefinition = WireDefinitionBase & {
	viewOnly: false | undefined
	fields: WireFieldDefinitionMap
	collection: string
	order?: WireOrderDescription[]
	batchsize?: number
	conditions?: WireConditionDefinition[]
}

type WireDefinition = ViewOnlyWireDefinition | RegularWireDefinition

type WireFieldDefinitionMap = {
	[key: string]: WireFieldDefinition
}

type WireFieldDefinition =
	| {
			id: string
			fields: WireFieldDefinitionMap
	  }
	| undefined
	| null

type WireOrderDescription = {
	field: string
	desc: boolean
}

export {
	WireDefinition,
	WireDefinitionMap,
	WireFieldDefinition,
	WireFieldDefinitionMap,
	RegularWireDefinition,
	ViewOnlyWireDefinition,
}
