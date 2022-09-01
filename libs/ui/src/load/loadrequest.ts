import { PlainWire } from "../bands/wire/types"

type LoadRequest = PlainWire & {
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
