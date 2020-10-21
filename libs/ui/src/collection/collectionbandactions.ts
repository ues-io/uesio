import { BandAction } from "../store/actions/actions"
import { PlainCollectionMap } from "./collection"

const LOAD = "LOAD"

interface LoadAction extends BandAction {
	name: typeof LOAD
	data: {
		collections: PlainCollectionMap
	}
}

export { LOAD, LoadAction }
