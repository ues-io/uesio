import { WireConditionDefinition } from "../bands/wire/conditions/conditions"
import { WireDefault } from "../bands/wire/defaults/defaults"

type WireDefinitionMap = {
	[key: string]: WireDefinition
}

type WireDefinition = {
	collection: string
	fields: WireFieldDefinitionMap
	conditions?: WireConditionDefinition[]
	defaults?: WireDefault[]
	order?: WireOrderDescription[]
	batchsize?: number
	init?: {
		query?: boolean
		create?: boolean
	}
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
	WireDefinition,
	WireDefinitionMap,
	WireFieldDefinition,
	WireFieldDefinitionMap,
}
