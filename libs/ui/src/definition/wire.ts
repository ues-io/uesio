import { WireConditionDefinition } from "../wire/wirecondition"
import { PlainWireDefault } from "../wire/wiredefault"
import { wire } from "@uesio/constants"

type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type WireDefinition = {
	collection: string
	fields: WireFieldDefinitionMap
	conditions: WireConditionDefinition[]
	defaults: PlainWireDefault[]
	type: wire.WireType
}

type WireFieldDefinitionMap = {
	[key: string]: WireFieldDefinition
}

type WireFieldDefinition = {
	id: string
}

export {
	WireDefinition,
	WireDefinitionMap,
	WireFieldDefinition,
	WireFieldDefinitionMap,
}
