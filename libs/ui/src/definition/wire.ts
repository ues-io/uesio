import { WireConditionDefinition } from "../bands/wire/conditions/conditions"
import { WireDefault } from "../bands/wire/defaults/defaults"
type WireType = "CREATE" | "QUERY" | "EMPTY"

type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type WireDefinition = {
	collection: string
	fields: WireFieldDefinitionMap
	conditions?: WireConditionDefinition[]
	defaults?: WireDefault[]
	type?: WireType
	order?: WireOrderDescription[]
	limit?: number
	offset?: number
}

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
	WireType,
	WireDefinition,
	WireDefinitionMap,
	WireFieldDefinition,
	WireFieldDefinitionMap,
}
