import { PlainWireRecord } from "../bands/wirerecord/types"

type SaveError = {
  recordid?: string
  fieldid?: string
  message: string
}

type SaveResponse = {
  wire: string
  errors: null | SaveError[]
  changes: ChangeResults
  deletes: ChangeResults
}

type ChangeResults = Record<string, PlainWireRecord>

type SaveResponseBatch = {
  wires: SaveResponse[]
}

export type { SaveResponse, SaveResponseBatch, SaveError }
