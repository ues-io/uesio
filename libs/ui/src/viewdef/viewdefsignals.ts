import { ActorSignal } from "../definition/signal"
import { Definition } from "../definition/definition"

const ADD_DEFINITION = "ADD_DEFINITION"

interface AddDefinitionSignal extends ActorSignal {
	signal: typeof ADD_DEFINITION
	path: string
	definition: Definition
	index?: number
}

export { ADD_DEFINITION, AddDefinitionSignal }
