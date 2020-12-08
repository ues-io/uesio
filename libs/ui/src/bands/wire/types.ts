import { WireConditionState } from "../../wire/wirecondition"
import { PlainWireRecordMap } from "../../wire/wirerecord"

type PlainWire = {
	name: string
	conditions: WireConditionState[]
	data: PlainWireRecordMap
	view: string
	original: PlainWireRecordMap
	changes: PlainWireRecordMap
	deletes: PlainWireRecordMap
	error?: string
}

export { PlainWire }
