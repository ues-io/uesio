import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"
import { AnyAction } from "redux"
import { useViewConfigValue } from "../bands/viewdef/selectors"
import { useView } from "../bands/view/selectors"
import { useEffect } from "react"
import { ViewParams } from "../bands/view/types"
import { Context } from "../context/context"
import loadViewOp from "../bands/view/operations/load"

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
	useConfigValue(key: string): string {
		const viewDefId = this.uesio.getViewDefId()
		return viewDefId ? useViewConfigValue(viewDefId, key) : ""
	}
}

export { ViewAPI, VIEW_BAND }
