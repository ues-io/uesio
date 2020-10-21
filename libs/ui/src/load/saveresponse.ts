import { PlainWireRecordMap } from "../wire/wirerecord"

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
	data: PlainWireRecordMap
	error: string
}

type SaveResponseBatch = {
	wires: SaveResponse[]
}

export { SaveResponse, SaveResponseBatch }
