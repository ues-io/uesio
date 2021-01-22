import { wire } from "@uesio/constants"
import { WireConditionState } from "../bands/wire/conditions/conditions"

type LoadRequest = {
	wire: string
	type: wire.WireType
	collection: string
	fields: LoadRequestField[]
	conditions: WireConditionState[]
	order?: OrderDescription[]
	limit?: number
	offset?: number
}

type OrderDescription = {
	field: string
	desc: boolean
}

type LoadRequestField = {
	id: string
	fields?: LoadRequestField[]
}

type LoadRequestBatch = {
	wires: LoadRequest[]
}

export { LoadRequest, LoadRequestField, LoadRequestBatch }
