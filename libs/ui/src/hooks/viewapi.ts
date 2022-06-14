import { Uesio } from "./hooks"
import { useConfigValue } from "../bands/configvalue"
import { useViewDef } from "../bands/viewdef"
import { ViewDefinition } from "../definition/viewdef"

const VIEW_BAND = "view"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useViewDef(viewDefId: string) {
		return useViewDef(viewDefId)?.parsed as ViewDefinition
	}
	useConfigValue(key: string) {
		return useConfigValue(key)?.content || ""
	}
}

export { ViewAPI, VIEW_BAND }
