import { AnyAction } from "redux"
import { StateFragment } from "../../definition/definition"
import RuntimeState from "../types/runtimestate"

const ACTOR = "ACTOR"
const BAND = "BAND"

type ActionReducer = (
	action: AnyAction,
	targetState: StateFragment,
	allState: RuntimeState
) => StateFragment

type ActionGroup = {
	[key: string]: ActionReducer
}

type ActionGroupStore = {
	[key: string]: ActionGroup
}

type ActionDefinitionBase = {
	name: string
	band: string
	//data: ActionData
	view?: string
}

type ActionData = {
	[key: string]: StateFragment
}

type ActorAction = {
	type: typeof ACTOR
	target: string
	scope?: string
} & ActionDefinitionBase

type BandAction = {
	type: typeof BAND
	targets?: string[]
} & ActionDefinitionBase

type StoreAction = ActorAction | BandAction

export {
	ActorAction,
	ActionData,
	BandAction,
	StoreAction,
	ActionGroup,
	ActionGroupStore,
	ACTOR,
	BAND,
}
