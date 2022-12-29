import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { setOrder, getFullWireId } from ".."

import { MetadataKey } from "../../builder/types"

export default (
	context: Context,
	wirename: string,
	order: { field: MetadataKey; desc: boolean }[]
) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			setOrder({
				entity: getFullWireId(viewId, wirename),
				order,
			})
		)
	return context
}
