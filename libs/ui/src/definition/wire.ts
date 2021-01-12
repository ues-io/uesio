import { wire } from "@uesio/constants"
import { WireConditionDefinition } from "../bands/wire/conditions/conditions"
import { WireDefault } from "../bands/wire/defaults/defaults"

type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type WireDefinition = {
	collection: string
	fields: WireFieldDefinitionMap
	conditions: WireConditionDefinition[]
	defaults: WireDefault[]
	type: wire.WireType
	order: WireOrderDescription[]
}

type WireFieldDefinitionMap = {
	[key: string]: WireFieldDefinition
}

type WireFieldDefinition = {
	id: string
	fields: WireFieldDefinitionMap
}

type WireOrderDescription = {
	field: string
	desc: boolean
}

export {
	WireDefinition,
	WireDefinitionMap,
	WireFieldDefinition,
	WireFieldDefinitionMap,
}
