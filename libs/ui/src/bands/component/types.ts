import { Definition } from "../../definition/definition"

type PlainComponentState = Definition

type ComponentState = {
	id: string
	state: PlainComponentState
}

export { ComponentState, PlainComponentState }
