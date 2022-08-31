import { ViewOnlyField, WireEvents } from "../../definition/wire"
import { SaveError } from "../../load/saveresponse"
import { WireFieldDefinitionMap } from "../../wireexports"
import { MetadataKey } from "../builder/types"
import { PlainWireRecord } from "../wirerecord/types"
import { WireConditionState } from "./conditions/conditions"
import { WireDefault } from "./defaults/defaults"

type OrderState = {
	field: MetadataKey
	desc: boolean
}

type PlainWire = {
	batchid: string
	batchnumber: number
	changes?: Record<string, PlainWireRecord>
	collection: string
	conditions?: WireConditionState[]
	order?: OrderState[]
	data: Record<string, PlainWireRecord>
	deletes?: Record<string, PlainWireRecord>
	errors?: Record<string, SaveError[]>
	more?: boolean
	name: string
	original?: Record<string, PlainWireRecord>
	query?: boolean
	create?: boolean
	view: string
	defaults?: WireDefault[]
	events?: WireEvents
	batchsize?: number
	requirewriteaccess?: boolean
	viewOnly: boolean
	fields: Record<string, ViewOnlyField> | WireFieldDefinitionMap
}

export { PlainWire }
