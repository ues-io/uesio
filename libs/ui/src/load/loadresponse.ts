import { PlainCollectionMap } from "../bands/collection/types"
import { PlainWireRecord } from "../bands/wirerecord/types"

type LoadResponse = {
	wire: string
	collection: string
	data?: PlainWireRecord[]
	hasMoreBatches: boolean
	batchNumber: number
}

type LoadResponseBatch = {
	wires: LoadResponse[]
	collections: PlainCollectionMap
}

export { LoadResponse, LoadResponseBatch }
