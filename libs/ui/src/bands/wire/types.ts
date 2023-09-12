import { WireEvents } from "../../definition/wire"
import { LoadRequestField } from "../../load/loadrequest"
import { SaveError } from "../../load/saveresponse"
import { MetadataKey } from "../builder/types"
import { PlainCollection } from "../collection/types"
import { PlainWireRecord } from "../wirerecord/types"
import { WireConditionState } from "./conditions/conditions"
import { WireDefault } from "./defaults/defaults"

// Define these types specifically so that we can overwrite them with app-specific types
type CollectionKey = MetadataKey | string
type CollectionFieldKey = MetadataKey | string

type OrderState = {
	field: MetadataKey
	desc?: boolean
}

type PlainWire = {
	batchid: string
	batchnumber: number
	changes: Record<string, PlainWireRecord>
	collection: CollectionKey
	conditions?: WireConditionState[]
	order?: OrderState[]
	data: Record<string, PlainWireRecord>
	deletes: Record<string, PlainWireRecord>
	errors?: Record<string, SaveError[]>
	more?: boolean
	name: string
	original: Record<string, PlainWireRecord>
	query?: boolean
	create?: boolean
	preloaded?: boolean
	view: string
	defaults?: WireDefault[]
	events?: WireEvents
	batchsize?: number
	requirewriteaccess?: boolean
	viewOnly: boolean
	viewOnlyMetadata?: PlainCollection
	fields: LoadRequestField[]
	isLoading?: boolean
	loadAll?: boolean
}

type ServerWire = PlainWire & {
	data: PlainWireRecord[]
}

export type {
	CollectionKey,
	CollectionFieldKey,
	PlainWire,
	OrderState,
	ServerWire,
}
