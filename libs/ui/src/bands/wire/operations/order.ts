import { Context } from "../../../context/context"
import { addOrder, setOrder, removeOrder, getFullWireId, toggleOrder } from ".."
import { ThunkFunc } from "../../../store/store"
import { MetadataKey } from "../../builder/types"

export const add =
	(
		context: Context,
		wirename: string,
		field: MetadataKey,
		desc: boolean
	): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (viewId)
			dispatch(
				addOrder({
					entity: getFullWireId(viewId, wirename),
					order: {
						field,
						desc,
					},
				})
			)
		return context
	}

export const set =
	(
		context: Context,
		wirename: string,
		order: { field: MetadataKey; desc: boolean }[]
	): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (order.constructor !== Array) {
			console.error("Order should be an array")
			return context
		}
		if (viewId)
			dispatch(
				setOrder({
					entity: getFullWireId(viewId, wirename),
					order,
				})
			)
		return context
	}

export const remove =
	(context: Context, wirename: string, fields: MetadataKey[]): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (viewId)
			dispatch(
				removeOrder({
					entity: getFullWireId(viewId, wirename),
					fields,
				})
			)
		return context
	}

export const toggle =
	(
		context: Context,
		wirename: string,
		order: { field: MetadataKey; desc: boolean }
	): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		const wire = context.getWire()
		if (viewId && wire) {
			const orderList = wire.getOrder()
			const isFound = orderList.some((item) => item.field === order.field)
			if (!isFound) {
				dispatch(
					setOrder({
						entity: getFullWireId(viewId, wirename),
						order: [order],
					})
				)
			} else {
				dispatch(
					toggleOrder({
						entity: getFullWireId(viewId, wirename),
						order,
					})
				)
			}
		}
		return context
	}
