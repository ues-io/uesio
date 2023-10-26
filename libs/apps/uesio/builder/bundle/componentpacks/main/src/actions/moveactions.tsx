import { component, context, definition } from "@uesio/ui"
import { move, get } from "../api/defapi"
import { FullPath } from "../api/path"
import ActionButton from "../helpers/actionbutton"
import { setSelectedPath } from "../api/stateapi"
import { SyntheticEvent } from "react"

const getArrayMoveParams = (
	context: context.Context,
	path: FullPath
): [
	boolean,
	boolean,
	(e: SyntheticEvent) => void,
	(e: SyntheticEvent) => void
] => {
	const index = component.path.getIndexFromPath(path.localPath)
	const indexPath = component.path.getIndexPath(path.localPath)
	const parentPath = component.path.getParentPath(indexPath)
	const parentDef = get(
		context,
		path.setLocal(parentPath)
	) as definition.Definition[]
	const size = parentDef?.length
	const enableBackward = !!index
	const enableForward = !!(index !== null && size && index < size - 1)

	const moveToIndex = (index: number) => {
		const destination = path.setLocal(`${parentPath}["${index}"]`)
		move(context, path, destination)
		setSelectedPath(context, destination)
	}

	return [
		enableBackward,
		enableForward,
		(e) => {
			e.stopPropagation()
			index && moveToIndex(index - 1)
		},
		(e) => {
			e.stopPropagation()
			index !== null && moveToIndex(index + 1)
		},
	]
}

const getMapMoveParams = (
	context: context.Context,
	path: FullPath
): [
	boolean,
	boolean,
	(e: SyntheticEvent) => void,
	(e: SyntheticEvent) => void
] => {
	const parentPath = component.path.getParentPath(path.localPath)
	const itemKey = component.path.getKeyAtPath(path.localPath)
	const parentDef = get(
		context,
		path.setLocal(parentPath)
	) as definition.DefinitionMap
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
			move(context, path.setLocal(`${parentPath}["${newKey}"]`), path)
		},
		() => {
			const newKey = entries[index + 1][0]
			move(context, path.setLocal(`${parentPath}["${newKey}"]`), path)
		},
	]
}

type Props = {
	path: FullPath
}

const MoveActions: definition.UtilityComponent<Props> = ({
	path,
	context,
	id,
}) => {
	const isArrayMove = component.path.isNumberIndex(
		component.path.getKeyAtPath(path.localPath)
	)
	const paramGetter = isArrayMove ? getArrayMoveParams : getMapMoveParams
	const [enableBackward, enableForward, onClickBackward, onClickForward] =
		paramGetter(context, path)
	return (
		<>
			<ActionButton
				title="Move Backward"
				onClick={onClickBackward}
				icon="arrow_upward"
				id={`${id}:move-backward`}
				disabled={!enableBackward}
				context={context}
			/>
			<ActionButton
				title="Move Forward"
				onClick={onClickForward}
				icon="arrow_downward"
				id={`${id}:move-forward`}
				disabled={!enableForward}
				context={context}
			/>
		</>
	)
}

export default MoveActions
