import { PlainWireRecord } from "../wirerecord/types"
import { WireConditionState } from "./conditions/conditions"

type PlainWire = {
	batchid: string
	batchnumber: number
	changes: Record<string, PlainWireRecord>
	collection: string
	conditions: WireConditionState[]
	data: Record<string, PlainWireRecord>
	deletes: Record<string, PlainWireRecord>
	error?: string
	more?: boolean
	name: string
	original: Record<string, PlainWireRecord>
	query: boolean
	view: string
	viewOnly?: boolean
}

export { PlainWire }
