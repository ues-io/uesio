import { WireConditionState } from "../bands/wire/conditions/conditions"
import {
	CollectionFieldKey,
	CollectionKey,
	OrderState,
} from "../bands/wire/types"
import { FieldType, SelectListMetadata } from "../wireexports"

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
	// If this is a View Only field (or on a View-only Wire),
	// then we will have field "metadata" specified inline on the Field
	type?: FieldType
	selectlist?: SelectListMetadata
}

type LoadRequestBatch = {
	wires: LoadRequest[]
	includeMetadata?: boolean
}

export type { LoadRequest, LoadRequestField, LoadRequestBatch }
