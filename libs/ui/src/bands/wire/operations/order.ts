import { Context } from "../../../context/context"
import { addOrder, setOrder, removeOrder, getFullWireId } from ".."
import { dispatch } from "../../../store/store"
import { MetadataKey } from "../../../metadata/types"
import { OrderState } from "../types"

export const add = (
	context: Context,
	wireName: string,
	field: MetadataKey,
	desc: boolean
) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			addOrder({
				entity: getFullWireId(viewId, wireName),
				order: {
					field,
					desc,
				},
			})
		)
	return context
}

export const set = (
	context: Context,
	wireName: string,
	order: OrderState[]
) => {
	const viewId = context.getViewId()
	if (order.constructor !== Array) {
		console.error("Order should be an array")
		return context
	}
	if (viewId)
		dispatch(
			setOrder({
				entity: getFullWireId(viewId, wireName),
				order,
			})
		)
	return context
}

export const remove = (
	context: Context,
	wireName: string,
	fields: MetadataKey[]
) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			removeOrder({
				entity: getFullWireId(viewId, wireName),
				fields,
			})
		)
	return context
}
