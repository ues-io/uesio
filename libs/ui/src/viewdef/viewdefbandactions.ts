import { BandAction } from "../store/actions/actions"

const CANCEL_VIEWDEF = "CANCEL_VIEWDEF"
const SAVE_VIEWDEF = "SAVE_VIEWDEF"

interface CancelViewDefAction extends BandAction {
	name: typeof CANCEL_VIEWDEF
}

interface SaveViewDefAction extends BandAction {
	name: typeof SAVE_VIEWDEF
}

export { CANCEL_VIEWDEF, SAVE_VIEWDEF, CancelViewDefAction, SaveViewDefAction }
