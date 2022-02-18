import { PlainWireRecord } from "./bands/wirerecord/types"
import { LoadRequestField, OrderDescription } from "./load/loadrequest"

type BeforeSaveBot = {
	load(request: LoadRequest): LoadResponse
}

type LoadResponse = PlainWireRecord[]

type ValueCondition = {
	field: string
	value: string
}

type LoadRequest = {
	collection: string
	fields: LoadRequestField[]
	conditions: ValueCondition[]
	order?: OrderDescription[]
}

export { BeforeSaveBot, LoadRequest }
