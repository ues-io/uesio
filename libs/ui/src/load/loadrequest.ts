import { WireConditionState } from "../bands/wire/conditions/conditions"
import {
	CollectionFieldKey,
	CollectionKey,
	OrderState,
} from "../bands/wire/types"

type LoadRequest = {
	batchid?: string
	batchnumber?: number
	collection: CollectionKey
	conditions?: WireConditionState[]
	order?: OrderState[]
	name: string
	query?: boolean
	view: string
	batchsize?: number
	requirewriteaccess?: boolean
	fields: LoadRequestField[]
	params?: Record<string, string>
}

type LoadRequestField = {
	id: CollectionFieldKey
	fields?: LoadRequestField[]
}

type LoadRequestBatch = {
	wires: LoadRequest[]
	includeMetadata?: boolean
}

export type { LoadRequest, LoadRequestField, LoadRequestBatch }
