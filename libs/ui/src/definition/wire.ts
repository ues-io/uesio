import { WireConditionDefinition } from "../wire/wirecondition"
import { PlainWireDefault } from "../wire/wiredefault"

type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type WireType = "CREATE" | "QUERY"

type WireDefinition = {
	collection: string
	fields: WireFieldDefinitionMap
	conditions: WireConditionDefinition[]
	defaults: PlainWireDefault[]
	type: WireType
}

type WireFieldDefinitionMap = {
	[key: string]: WireFieldDefinition
}

type WireFieldDefinition = {
	id: string
}

export {
	WireType,
	WireDefinition,
	WireDefinitionMap,
	WireFieldDefinition,
	WireFieldDefinitionMap,
}
