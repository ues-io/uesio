import { BandAction } from "../store/actions/actions"
import { ViewParams } from "./view"

const ADD_VIEW = "ADD_VIEW"

interface AddViewAction extends BandAction {
	name: typeof ADD_VIEW
	data: {
		namespace: string
		name: string
		path: string
		params: ViewParams
	}
}

export { ADD_VIEW, AddViewAction }
