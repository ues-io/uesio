import { PlainCollectionMap } from "../bands/collection/types"
import { PlainWire } from "../bands/wire/types"
import { SelectListMetadataMap } from "../definition/selectlist"

type LoadResponseBatch = {
  wires: PlainWire[]
  collections?: PlainCollectionMap
  selectlists?: SelectListMetadataMap
}

type CollectionMetadataResponseBatch = {
  collections: PlainCollectionMap
}

export type { CollectionMetadataResponseBatch, LoadResponseBatch }
