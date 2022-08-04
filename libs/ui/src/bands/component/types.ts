import { FieldValue } from "../wirerecord/types"

type PlainComponentState = FieldValue | Record<string, unknown>

type ComponentState = {
	view: string
	id: string
	componentType: string
	state: PlainComponentState
}

export { ComponentState, PlainComponentState }
