import { Dispatcher } from "../../../store/store"
import { Context, getWireDefFromWireName } from "../../../context/context"
import { AnyAction } from "redux"
import { init } from ".."
import { getInitializedConditions } from "../conditions/conditions"

export default (context: Context, wireNames: string[]) =>
	(dispatch: Dispatcher<AnyAction>) => {
		const initializedWires = wireNames.map((wirename: string) => {
			const viewId = context.getViewId()
			if (!viewId) throw new Error("Could not get View Def Id")
			const wireDef = getWireDefFromWireName(viewId, wirename)
			if (!wireDef) throw new Error("Cannot initialize invalid wire")
			const doQuery = !wireDef.init || wireDef.init.query || false

			return {
				view: viewId || "",
				query: doQuery,
				name: wirename,
				conditions: getInitializedConditions(wireDef.conditions),
				batchid: "",
				batchnumber: 0,
				data: {},
				original: {},
				changes: {},
				deletes: {},
			}
		})

		dispatch(init(initializedWires))
		return context
	}
