import { Uesio } from "./hooks"
import { useConfigValue } from "../bands/configvalue"
import { getViewDef, useViewDef } from "../bands/viewdef"
import { ViewDefinition } from "../definition/viewdef"

const VIEW_BAND = "view"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useViewDef(viewDefId: string) {
		return useViewDef(viewDefId)?.parsed as ViewDefinition | undefined
	}

	getViewDef(viewDefId: string) {
		return getViewDef(viewDefId)?.parsed as ViewDefinition | undefined
	}
	useConfigValue(key: string) {
		return useConfigValue(key)?.content || ""
	}
}

export { ViewAPI, VIEW_BAND }
