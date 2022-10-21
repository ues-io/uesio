import { FunctionComponent } from "react"
import { component, definition, builder } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const getArrayMoveParams = (
	path: string,
	valueAPI: builder.ValueAPI,
	selectKey?: string
): [boolean, boolean, () => void, () => void] => {
	const index = component.path.getIndexFromPath(path)
	const indexPath = component.path.getIndexPath(path)
	const parentPath = component.path.getParentPath(indexPath)
	const parentDef = valueAPI.get(parentPath) as definition.Definition[]
	const size = parentDef?.length
	const enableBackward = !!index
	const enableForward = !!(index !== null && size && index < size - 1)

	const moveToIndex = (index: number) => {
		const toPath = `${parentPath}["${index}"]`
		valueAPI.move(path, toPath, selectKey)
	}

	return [
		enableBackward,
		enableForward,
		() => {
			index && moveToIndex(index - 1)
		},
		() => {
			index !== null && moveToIndex(index + 1)
		},
	]
}

const getMapMoveParams = (
	path: string,
	valueAPI: builder.ValueAPI
): [boolean, boolean, () => void, () => void] => {
	const parentPath = component.path.getParentPath(path)
	const itemKey = component.path.getKeyAtPath(path)
	const parentDef = valueAPI.get(parentPath) as definition.DefinitionMap
	const entries = Object.entries(parentDef)
	const size = entries.length
	const index = entries.findIndex(([key]) => key === itemKey)
	const enableBackward = !!index
	const enableForward = !!(index !== null && size && index < size - 1)
	return [
		enableBackward,
		enableForward,
		() => {
			const newKey = entries[index - 1][0]
			valueAPI.move(`${parentPath}["${newKey}"]`, path)
		},
		() => {
			const newKey = entries[index + 1][0]
			valueAPI.move(`${parentPath}["${newKey}"]`, path)
		},
	]
}

const MoveActions: FunctionComponent<ActionProps> = ({
	path,
	valueAPI,
	context,
	propsDef,
}) => {
	if (!path) return null

	const trimmedPath =
		propsDef?.type === "component"
			? component.path.getParentPath(path)
			: path
	const selectKey =
		(propsDef?.type === "component" && component.path.getKeyAtPath(path)) ||
		undefined

	const isArrayMove = component.path.isNumberIndex(
		component.path.getKeyAtPath(trimmedPath)
	)
	const paramGetter = isArrayMove ? getArrayMoveParams : getMapMoveParams
	const [enableBackward, enableForward, onClickBackward, onClickForward] =
		paramGetter(trimmedPath, valueAPI, selectKey)
	return (
		<>
			<ActionButton
				title="Move Backward"
				onClick={onClickBackward}
				icon="arrow_upward"
				disabled={!enableBackward}
				context={context}
			/>
			<ActionButton
				title="Move Forward"
				onClick={onClickForward}
				icon="arrow_downward"
				disabled={!enableForward}
				context={context}
			/>
		</>
	)
}

export default MoveActions
