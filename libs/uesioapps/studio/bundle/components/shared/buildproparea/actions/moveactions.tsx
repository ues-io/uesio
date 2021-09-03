import { FunctionComponent } from "react"
import { hooks, component, definition } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import { ValueAPI } from "../../propertiespaneldefinition"

const getArrayMoveParams = (
	path: string,
	valueAPI: ValueAPI
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

		const suffix = component.path.getPathSuffix(path)
		const newSelectedPath = `${toPath}["${suffix}"]`
		valueAPI.move(path, newSelectedPath)
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
	valueAPI: ValueAPI
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
			valueAPI.move(path, `${parentPath}["${newKey}"]`)
		},
		() => {
			const newKey = entries[index + 1][0]
			valueAPI.move(path, `${parentPath}["${newKey}"]`)
		},
	]
}

const MoveActions: FunctionComponent<ActionProps> = ({
	path,
	valueAPI,
	context,
}) => {
	if (!path) return null

	const isArrayMove = component.path.isNumberIndex(
		component.path.getKeyAtPath(component.path.getParentPath(path))
	)
	const paramGetter = isArrayMove ? getArrayMoveParams : getMapMoveParams
	const [enableBackward, enableForward, onClickBackward, onClickForward] =
		paramGetter(path, valueAPI)
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
