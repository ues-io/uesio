import { FunctionComponent } from "react"
import { hooks, component, definition } from "@uesio/ui"
import { ActionProps } from "../actiondefinition"
import ActionButton from "../actionbutton"

const MoveActionsComp: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path = "", valueAPI, context } = props

	// Pop off the first item of the path and check to see if its a number

	const index = component.path.getIndexFromPath(path)
	const indexPath = component.path.getIndexPath(path)
	const parentPath = component.path.getParentPath(indexPath)
	const parentDef = valueAPI.get(parentPath) as definition.Definition[]
	const size = parentDef?.length
	const enableBackward = !!index
	const enableForward = index !== null && size && index < size - 1

	const moveToIndex = (index: number) => {
		const toPath = `${parentPath}["${index}"]`

		const suffix = component.path.getPathSuffix(path)
		const newSelectedPath = `${toPath}["${suffix}"]`
		valueAPI.move(path, newSelectedPath)
	}

	const onClickBackward = () => index && moveToIndex(index - 1)
	const onClickForward = () => index !== null && moveToIndex(index + 1)
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

export default MoveActionsComp
