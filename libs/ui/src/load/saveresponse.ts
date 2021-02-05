import { PlainWireRecord } from "../bands/wirerecord/types"

type SaveResponse = {
	wire: string
	error: string
	changes: ChangeResults
	deletes: ChangeResults
}

type ChangeResults = {
	[key: string]: Record<string, PlainWireRecord>
}

type SaveResponseBatch = {
	wires: SaveResponse[]
}

export { SaveResponse, SaveResponseBatch }
