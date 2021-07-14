import { PlainWireRecord } from "../bands/wirerecord/types"

type SaveError = {
	recordid: string
	fieldid: string
	message: string
}

type SaveResponse = {
	wire: string
	errors: SaveError[]
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
