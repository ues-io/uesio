import { FieldValue } from "../wirerecord/types"

type PlainComponentState = FieldValue

type ComponentState = {
	view: string
	id: string
	componentType: string
	state: PlainComponentState
}

export { ComponentState, PlainComponentState }
