import { Uesio } from "./hooks"
import { useConfigValue } from "../bands/configvalue"
import { getViewDef, useViewDef } from "../bands/viewdef"

const VIEW_BAND = "view"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useViewDef(viewDefId: string) {
		return useViewDef(viewDefId)
	}

	getViewDef(viewDefId: string) {
		return getViewDef(viewDefId)
	}
	useConfigValue(key: string) {
		return useConfigValue(key)?.value || ""
	}
}

export { ViewAPI, VIEW_BAND }
