import { PlainWireRecord } from "../bands/wirerecord/types"

type SaveResponse = {
	wire: string
	error: string
	changeResults: ChangeResults
	deleteResults: ChangeResults
}

type ChangeResults = {
	[key: string]: ChangeResult
}

type ChangeResult = {
	data: Record<string, PlainWireRecord>
	error: string
}

type SaveResponseBatch = {
	wires: SaveResponse[]
}

export { SaveResponse, SaveResponseBatch }
