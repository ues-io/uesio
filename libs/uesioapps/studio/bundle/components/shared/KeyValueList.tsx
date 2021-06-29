import React, { FC, useReducer, useEffect } from "react"
import { component, definition } from "@uesio/ui"

const Grid = component.registry.getUtility("io.grid")
const Textfield = component.registry.getUtility("io.textfield")
import ActionButton from "./buildproparea/actions/actionbutton"

// TODO, update type
interface T extends definition.BaseProps {
	onListUpdate: (arg1: List) => void
	value: List | []
}

export type ListItem = {
	key: string
	value: string
}
export type List = ListItem[]

type ListAction =
	| { type: "set"; payload: List }
	| { type: "add"; payload: ListItem }
	| { type: "remove"; id: number }
	| { type: "update"; payload: { id: number; key: string; value: string } }
	| { type: "removeAll" }

const listReducer = (state: { list: List }, action: ListAction) => {
	switch (action.type) {
		case useList.types.set: {
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

const useList = (initialValue: List) => {
	const [{ list }, dispatch] = useReducer(listReducer, {
		list: [...initialValue, { key: "", value: "" }],
	})

	useEffect(() => {
		// Ensure there is always blank option to fill in
		const { key, value } = list[list.length - 1]
		if (!!key && !!value)
			return dispatch({
				type: useList.types.add,
				payload: { key: "", value: "" },
			})
	}, [list])

	const set = (payload: List) =>
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

	const stylesRow = {
		root: {
			gridTemplateColumns: "4fr 6fr 1fr",
			columnGap: "5px",
			".deleteIcon": {
				opacity: "0",
			},
			"&:hover": {
				backgroundColor: "rgba(0, 0, 0, 0.05)",
				".deleteIcon": {
					opacity: "1",
				},
			},
			padding: "1px",
			paddingLeft: "8px",
		},
	}
	const stylesInput = {
		root: {
			padding: "0",
			border: "none",
			cursor: "pointer",
			"&.last input": {
				border: "1px solid #eee",
				padding: "4px",
			},
		},
		input: {
			padding: "2px",
			backgroundColor: "transparent",
			border: "1px solid transparent",
			cursor: "pointer",

			"&:focus": {
				border: "1px solid #eee",
				cursor: "text",
			},
		},
	}

	return (
		<>
			{list.map((item, i) => (
				<Grid context={context} styles={stylesRow}>
					<Textfield
						value={item.key}
						context={context}
						placeholder={"e.g. padding"}
						className={i === list.length - 1 ? "last" : ""}
						styles={stylesInput}
						setValue={(key: string) =>
							update({
								id: i,
								key,
								value: item.value,
							})
						}
					/>
					<Textfield
						value={item.value}
						context={context}
						className={i === list.length - 1 ? "last" : ""}
						styles={{ ...stylesInput }}
						placeholder={"e.g. 12px"}
						setValue={(value: string) =>
							update({
								id: i,
								key: item.key,
								value,
							})
						}
					/>
					<div
						className={"deleteIcon"}
						style={{ display: "flex", alignItems: "center" }}
					>
						{i !== list.length - 1 && (
							<ActionButton
								title="Delete"
								onClick={() => remove(i)}
								icon="delete"
								context={props.context}
							/>
						)}
					</div>
				</Grid>
			))}
		</>
	)
}
export default KeyValueList
