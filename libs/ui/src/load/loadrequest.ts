import { WireConditionState } from "../bands/wire/conditions/conditions"
import { OrderState } from "../bands/wire/types"

type LoadRequest = {
	batchid: string
	batchnumber: number
	collection: string
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
	id: string
	fields?: LoadRequestField[]
}

type LoadRequestBatch = {
	wires: LoadRequest[]
}

export { LoadRequest, LoadRequestField, LoadRequestBatch }
