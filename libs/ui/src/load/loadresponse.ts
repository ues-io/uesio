import { PlainCollectionMap } from "../bands/collection/types"

type LoadResponse = {
	wire: string
	collection: string
	data?: LoadResponseRecord[]
}

type LoadResponseRecord = {
	[key: string]: FieldValue
}

type FieldValue =
	| string
	| number
	| boolean
	| undefined
	| null
	| LoadResponseRecord
type KeyValue = string | number

type LoadResponseBatch = {
	wires: LoadResponse[]
	collections: PlainCollectionMap
}

export {
	LoadResponse,
	LoadResponseBatch,
	LoadResponseRecord,
	FieldValue,
	KeyValue,
}
