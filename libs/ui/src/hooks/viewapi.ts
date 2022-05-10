import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"
import { AnyAction } from "redux"
import { useView } from "../bands/view/selectors"
import { useEffect } from "react"
import { ViewParams } from "../bands/view/types"
import { Context } from "../context/context"
import loadViewOp from "../bands/view/operations/load"
import { useConfigValue } from "../bands/configvalue"
import { useViewDef } from "../bands/viewdef"
import { PlainViewDef } from "../definition/viewdef"

const VIEW_BAND = "view"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useView(viewId?: string, params?: ViewParams, context?: Context) {
		const view = useView(viewId || "")
		useEffect(() => {
			const newParams = params ? JSON.stringify(params) : ""
			const oldParams =
				view && view.params ? JSON.stringify(view.params) : ""
			if (!view || (view && oldParams !== newParams)) {
				this.dispatcher(
					loadViewOp({
						context: context || this.uesio.getContext(),
						path: this.uesio.getPath() || "",
						params,
					})
				)
			}
		})
		return view
	}
	useViewDef(viewDefId: string) {
		return useViewDef(viewDefId)?.parsed as PlainViewDef
	}
	useConfigValue(key: string) {
		return useConfigValue(key)?.content || ""
	}
}

export { ViewAPI, VIEW_BAND }
