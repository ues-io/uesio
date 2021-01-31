import { Dispatcher } from "../../../store/store"
import { Context } from "../../../context/context"
import { AnyAction } from "redux"
import { cancel } from ".."

export default (context: Context, wirename: string) => (
	dispatch: Dispatcher<AnyAction>
) => {
	const viewId = context.getViewId()
	if (viewId) dispatch(cancel({ entity: `${viewId}/${wirename}` }))
	return context
}
