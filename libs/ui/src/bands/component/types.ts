import { Definition } from "../../definition/definition"

type PlainComponentState = Definition

type ComponentState = {
	view: string
	id: string
	componentType: string
	state: PlainComponentState
}

export { ComponentState, PlainComponentState }
