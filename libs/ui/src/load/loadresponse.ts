import { PlainCollectionMap } from "../bands/collection/types"
import { PlainWire } from "../bands/wire/types"

type LoadResponseBatch = {
	wires: PlainWire[]
	collections?: PlainCollectionMap
}

type CollectionMetadataResponseBatch = {
	collections: PlainCollectionMap
}

export type { CollectionMetadataResponseBatch, LoadResponseBatch }
