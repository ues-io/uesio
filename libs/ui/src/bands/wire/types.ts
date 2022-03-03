import { PlainWireRecord } from "../wirerecord/types"
import { WireConditionState } from "./conditions/conditions"
type WireError = {
	message?: string
	fieldId?: string
}
type PlainWire = {
	name: string
	conditions: WireConditionState[]
	query: boolean
	data: Record<string, PlainWireRecord>
	batchid: string
	view: string
	original: Record<string, PlainWireRecord>
	changes: Record<string, PlainWireRecord>
	deletes: Record<string, PlainWireRecord>
	errors?: WireError[]
	batchnumber: number
	more?: boolean
}

export { PlainWire, WireError }
