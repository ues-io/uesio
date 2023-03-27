import { PlainCollectionMap } from "../bands/collection/types"
import { PlainWire } from "../bands/wire/types"

type LoadResponseBatch = {
	wires: PlainWire[]
	collections: PlainCollectionMap
}

export type { LoadResponseBatch }
