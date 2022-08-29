import { SaveError } from "../../load/saveresponse"
import { WireDefinition } from "../../wireexports"
import { MetadataKey } from "../builder/types"
import { PlainWireRecord } from "../wirerecord/types"
import { WireConditionState } from "./conditions/conditions"

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
	def?: WireDefinition
	data: Record<string, PlainWireRecord>
	deletes?: Record<string, PlainWireRecord>
	errors?: Record<string, SaveError[]>
	more?: boolean
	name: string
	original?: Record<string, PlainWireRecord>
	query: boolean
	view: string
}

export { PlainWire }
