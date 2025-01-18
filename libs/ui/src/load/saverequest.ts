import { PlainWireRecord } from "../bands/wirerecord/types"

type SaveRequest = {
  wire: string
  collection: string
  changes: Record<string, PlainWireRecord>
  deletes: Record<string, PlainWireRecord>
  options?: {
    upsert: boolean
  }
  params?: Record<string, string>
}

type SaveRequestBatch = {
  wires: SaveRequest[]
}

export type { SaveRequest, SaveRequestBatch }
