import React, { FC, useState, useReducer, useEffect } from "react"
import { component, hooks } from "@uesio/ui"
import { keyBy } from "lodash"

const Grid = component.registry.getUtility("io.grid")
const Textfield = component.registry.getUtility("io.textfield")
import ActionButton from "./shared/buildproparea/actions/actionbutton"

// TODO, update type
type T = any

export type ListItem = {
	key: string
	value: string
}

type ListAction =
	| { type: "set"; payload: ListItem[] }
	| { type: "add"; payload: ListItem }
	| { type: "remove"; id: number }
	| { type: "update"; payload: { id: number; key: string; value: string } }
	| { type: "removeAll" }

const listReducer = (state: { list: ListItem[] }, action: ListAction) => {
	switch (action.type) {
		case useList.types.set: {
			console.log("setting", action)
			return {
				list: action.payload,
			}
		}
		case useList.types.add: {
			return {
				list: [...state.list, action.payload],
			}
		}
		case useList.types.remove: {
			if (listReducer.length - 1 === action.id) {
				console.warn(`Can't remove last list item`)
				return {
					list: state.list,
				}
			}
			return {
				list: state.list.filter((l, index) => index !== action.id),
			}
		}
		case useList.types.update: {
			const {
				payload: { id, key, value },
			} = action
			return {
				list: state.list.map((el, i) =>
					i === id ? { key, value } : el
				),
			}
		}
		case useList.types.removeAll: {
			return {
				list: [{ key: "", value: "" }],
			}
		}

		default:
			throw new Error(`Unhandled type: ${action}`)
	}
}

const useList = (initialValue: ListItem[]) => {
	const [{ list }, dispatch] = useReducer(listReducer, {
		list: [...initialValue, { key: "", value: "" }],
	})

	useEffect(() => {
		// Ensure there is always blank option to fill in
		const { key, value } = list[list.length - 1]
		const lastItemIsEmpty = !key && !value
		if (!lastItemIsEmpty)
			return dispatch({
				type: useList.types.add,
				payload: { key: "", value: "" },
			})
	}, [list])

	const set = (payload: ListItem[]) =>
		dispatch({ type: useList.types.set, payload })
	const add = (payload: ListItem) =>
		dispatch({ type: useList.types.add, payload })
	const remove = (id: number) => dispatch({ type: useList.types.remove, id })
	const update = (payload: { id: number; key: string; value: string }) =>
		dispatch({ type: useList.types.update, payload })
	const removeAll = () => dispatch({ type: useList.types.removeAll })

	return { list, set, add, remove, update, removeAll }
}

const useListtypes: {
	add: "add"
	remove: "remove"
	update: "update"
	removeAll: "removeAll"
	set: "set"
} = {
	add: "add",
	remove: "remove",
	update: "update",
	removeAll: "removeAll",
	set: "set",
}

useList.types = useListtypes

const KeyValueList: FC<T> = (props) => {
	const { context, onListUpdate, value } = props
	const { list, set, add, remove, update, removeAll } = useList(value)

	useEffect(() => {
		// TODO, sanitize list (E.g. Validation, empty values)
		onListUpdate(list.slice(0, list.length - 1))
	}, [list])

	return (
		<Grid
			context={context}
			styles={{
				root: {
					gridTemplateColumns: "4fr 6fr 1fr",
					columnGap: "5px",
				},
			}}
		>
			{list.map((item, i) => (
				<>
					<Textfield
						value={item.key}
						context={context}
						placeholder={"e.g. padding"}
						setValue={(x: string) =>
							update({
								id: i,
								key: x,
								value: item.value,
							})
						}
					/>
					<Textfield
						value={item.value}
						context={context}
						placeholder={"e.g. 12px"}
						setValue={(x: string) =>
							update({
								id: i,
								key: item.key,
								value: x,
							})
						}
					/>
					<div style={{ display: "flex", alignItems: "center" }}>
						{i !== list.length - 1 && (
							<ActionButton
								title="Delete"
								onClick={() => remove(i)}
								icon="delete"
								context={props.context}
							/>
						)}
					</div>
				</>
			))}
		</Grid>
	)
}
export default KeyValueList
