import { ActorAction } from "../store/actions/actions"
import { Definition } from "../definition/definition"

const SET_DEFINITION = "SET_DEFINITION"
const ADD_DEFINITION = "ADD_DEFINITION"
const ADD_DEFINITION_PAIR = "ADD_DEFINITION_PAIR"
const MOVE_DEFINITION = "MOVE_DEFINITION"
const REMOVE_DEFINITION = "REMOVE_DEFINITION"
const CHANGE_DEFINITION_KEY = "CHANGE_DEFINITION_KEY"

interface SetDefinitionAction extends ActorAction {
	name: typeof SET_DEFINITION
	data: {
		path: string
		definition: Definition
	}
}

interface AddDefinitionAction extends ActorAction {
	name: typeof ADD_DEFINITION
	data: {
		path: string
		definition: Definition
		index: number
	}
}

interface AddDefinitionPairAction extends ActorAction {
	name: typeof ADD_DEFINITION_PAIR
	data: {
		path: string
		definition: Definition
		key: string
	}
}

interface RemoveDefinitionAction extends ActorAction {
	name: typeof REMOVE_DEFINITION
	data: {
		path: string
	}
}

interface MoveDefinitionAction extends ActorAction {
	name: typeof MOVE_DEFINITION
	data: {
		fromPath: string
		toPath: string
	}
}

type ChangeDefinitionKeyAction = {
	name: typeof CHANGE_DEFINITION_KEY
	data: {
		path: string
		key: string
	}
} & ActorAction

type ViewDefAction =
	| SetDefinitionAction
	| AddDefinitionAction
	| AddDefinitionPairAction
	| RemoveDefinitionAction
	| MoveDefinitionAction
	| ChangeDefinitionKeyAction

export {
	ViewDefAction,
	SET_DEFINITION,
	ADD_DEFINITION,
	ADD_DEFINITION_PAIR,
	REMOVE_DEFINITION,
	MOVE_DEFINITION,
	CHANGE_DEFINITION_KEY,
	SetDefinitionAction,
	AddDefinitionAction,
	AddDefinitionPairAction,
	RemoveDefinitionAction,
	MoveDefinitionAction,
	ChangeDefinitionKeyAction,
}
