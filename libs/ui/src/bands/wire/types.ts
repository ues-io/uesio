import { PlainWireRecord } from "../wirerecord/types"
import { WireConditionState } from "./conditions/conditions"

type PlainWire = {
	name: string
	conditions: WireConditionState[]
	data: Record<string, PlainWireRecord>
	view: string
	original: Record<string, PlainWireRecord>
	changes: Record<string, PlainWireRecord>
	deletes: Record<string, PlainWireRecord>
	error?: string
}

export { PlainWire }
