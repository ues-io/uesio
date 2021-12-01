import { PlainCollectionMap } from "../bands/collection/types"
import { PlainWireRecord } from "../bands/wirerecord/types"

type LoadResponse = {
	wire: string
	collection: string
	data?: PlainWireRecord[]
	more?: boolean
}

type LoadResponseBatch = {
	wires: LoadResponse[]
	collections: PlainCollectionMap
}

export { LoadResponse, LoadResponseBatch }
