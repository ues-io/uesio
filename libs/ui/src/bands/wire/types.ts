import { WireDefinition } from "../../definition/wire"
import { SaveError } from "../../load/saveresponse"
import { MetadataKey } from "../builder/types"
import { PlainWireRecord } from "../wirerecord/types"
import { WireConditionState } from "./conditions/conditions"

type PlainWire = {
	batchid: string
	batchnumber: number
	changes: Record<string, PlainWireRecord>
	collection: string
	conditions: WireConditionState[]
	order: { field: MetadataKey; desc: boolean }[]
	data: Record<string, PlainWireRecord>
	def: WireDefinition
	deletes: Record<string, PlainWireRecord>
	errors?: Record<string, SaveError[]>
	more?: boolean
	name: string
	original: Record<string, PlainWireRecord>
	query: boolean
	view: string
	viewOnly?: boolean
}

export { PlainWire }
