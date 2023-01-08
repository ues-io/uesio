import { component, definition } from "@uesio/ui"
import { move, get } from "../api/defapi"
import ActionButton from "../shared/buildproparea/actions/actionbutton"

const getArrayMoveParams = (
	path: string,
	selectKey?: string
): [boolean, boolean, () => void, () => void] => {
	const index = component.path.getIndexFromPath(path)
	const indexPath = component.path.getIndexPath(path)
	const parentPath = component.path.getParentPath(indexPath)
	const parentDef = get(parentPath) as definition.Definition[]
	const size = parentDef?.length
	const enableBackward = !!index
	const enableForward = !!(index !== null && size && index < size - 1)

	const moveToIndex = (index: number) => {
		const toPath = `${parentPath}["${index}"]`
		move(path, toPath, selectKey)
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
	path: string
): [boolean, boolean, () => void, () => void] => {
	const parentPath = component.path.getParentPath(path)
	const itemKey = component.path.getKeyAtPath(path)
	const parentDef = get(parentPath) as definition.DefinitionMap
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
			move(`${parentPath}["${newKey}"]`, path)
		},
		() => {
			const newKey = entries[index + 1][0]
			move(`${parentPath}["${newKey}"]`, path)
		},
	]
}

const MoveActions: definition.UtilityComponent = ({ path, context }) => {
	if (!path) return null

	const isArrayMove = component.path.isNumberIndex(
		component.path.getKeyAtPath(path)
	)
	const paramGetter = isArrayMove ? getArrayMoveParams : getMapMoveParams
	const [enableBackward, enableForward, onClickBackward, onClickForward] =
		paramGetter(path, undefined)
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
