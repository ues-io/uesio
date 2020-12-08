import { WireConditionDefinition } from "../wire/wirecondition"
import { WireDefault } from "../wire/wiredefault"
import { wire } from "@uesio/constants"

type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type WireDefinition = {
	collection: string
	fields: WireFieldDefinitionMap
	conditions: WireConditionDefinition[]
	defaults: WireDefault[]
	type: wire.WireType
}

type WireFieldDefinitionMap = {
	[key: string]: WireFieldDefinition
}

type WireFieldDefinition = {
	id: string
	fields: WireFieldDefinitionMap
}

export {
	WireDefinition,
	WireDefinitionMap,
	WireFieldDefinition,
	WireFieldDefinitionMap,
}
