import { PlainWireRecordMap } from "./wirerecord"

type SaveRequest = {
	wire: string
	collection: string
	changes: PlainWireRecordMap
	deletes: PlainWireRecordMap
}

type SaveRequestBatch = {
	wires: SaveRequest[]
}

export { SaveRequest, SaveRequestBatch }
