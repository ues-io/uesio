import { WireDefinitionMap } from "../definition/wire"
import { LoadResponse } from "../load/loadresponse"
import { SaveResponseBatch } from "../load/saveresponse"
import { BandAction } from "../store/actions/actions"

const SAVE = "SAVE"
const LOAD = "LOAD"
const ADD_WIRES = "ADD_WIRES"
const ADD_ERRORS = "ADD_ERRORS"

interface SaveAction extends BandAction {
	name: typeof SAVE
	data: SaveResponseBatch
}

interface LoadAction extends BandAction {
	name: typeof LOAD
	data: {
		responses: LoadResponse[]
		targets: string[]
	}
}

interface AddWiresAction extends BandAction {
	name: typeof ADD_WIRES
	data: WireDefinitionMap
	view: string
}

interface AddErrorsAction extends BandAction {
	name: typeof ADD_ERRORS
	data: {
		error: string
		targets: string[]
	}
}

export {
	SAVE,
	LOAD,
	ADD_WIRES,
	ADD_ERRORS,
	AddWiresAction,
	LoadAction,
	SaveAction,
	AddErrorsAction,
}
