import { BandAction } from "../store/actions/actions"

const ADD_VIEWDEF = "ADD_VIEWDEF"
const CANCEL_VIEWDEF = "CANCEL_VIEWDEF"
const SAVE_VIEWDEF = "SAVE_VIEWDEF"

interface AddViewDefAction extends BandAction {
	name: typeof ADD_VIEWDEF
	data: {
		namespace: string
		name: string
	}
}

interface CancelViewDefAction extends BandAction {
	name: typeof CANCEL_VIEWDEF
}

interface SaveViewDefAction extends BandAction {
	name: typeof SAVE_VIEWDEF
}

export {
	ADD_VIEWDEF,
	CANCEL_VIEWDEF,
	SAVE_VIEWDEF,
	AddViewDefAction,
	CancelViewDefAction,
	SaveViewDefAction,
}
