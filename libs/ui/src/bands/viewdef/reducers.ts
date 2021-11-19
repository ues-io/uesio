import { PlainViewDef } from "./types"

import {
	AddDefinitionPayload,
	MoveDefinitionPayload,
	RemoveDefinitionPayload,
	SetDefinitionPayload,
} from "../builder"

import {
	moveDef as genericMoveDef,
	addDef as genericAddDef,
	setDef as genericSetDef,
	removeDef as genericRemoveDef,
} from "../../store/reducers"

const setDef = (state: PlainViewDef, payload: SetDefinitionPayload) => {
	genericSetDef(state, payload)
}

const addDef = (state: PlainViewDef, payload: AddDefinitionPayload) => {
	genericAddDef(state, payload)
}

const removeDef = (state: PlainViewDef, payload: RemoveDefinitionPayload) => {
	genericRemoveDef(state, payload)
}

const moveDef = (state: PlainViewDef, payload: MoveDefinitionPayload) => {
	genericMoveDef(state, payload)
}

export { removeDef, addDef, moveDef, setDef }
