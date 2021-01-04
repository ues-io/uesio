import { PlainWireRecord } from "../bands/wirerecord/types"

type SaveRequest = {
	wire: string
	collection: string
	changes: Record<string, PlainWireRecord>
	deletes: Record<string, PlainWireRecord>
}

type SaveRequestBatch = {
	wires: SaveRequest[]
}

export { SaveRequest, SaveRequestBatch }
