import {
	AddDefinitionPayload,
	MoveDefinitionPayload,
	RemoveDefinitionPayload,
	SetDefinitionPayload,
} from "../builder"
import { ComponentVariant } from "./types"
import {
	moveDef as genericMoveDef,
	addDef as genericAddDef,
	setDef as genericSetDef,
	removeDef as genericRemoveDef,
} from "../../store/reducers"

const setDef = (state: ComponentVariant, payload: SetDefinitionPayload) => {
	genericSetDef(state, payload)
}

const addDef = (state: ComponentVariant, payload: AddDefinitionPayload) => {
	genericAddDef(state, payload)
}

const removeDef = (
	state: ComponentVariant,
	payload: RemoveDefinitionPayload
) => {
	genericRemoveDef(state, payload)
}

const moveDef = (state: ComponentVariant, payload: MoveDefinitionPayload) => {
	genericMoveDef(state, payload)
}

export { removeDef, addDef, moveDef, setDef }
