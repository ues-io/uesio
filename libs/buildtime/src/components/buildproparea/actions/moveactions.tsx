import React, { FunctionComponent } from "react"
import { hooks, component, definition } from "@uesio/ui"
import UpIcon from "@material-ui/icons/ArrowUpward"
import DownIcon from "@material-ui/icons/ArrowDownward"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const MoveActions: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const path = props.path

	// Pop off the first item of the path and check to see if its a number

	const index = component.path.getIndexFromPath(path)
	const indexPath = component.path.getIndexPath(path)
	const parentPath = component.path.getParentPath(indexPath)
	const parentDef = uesio.view.useDefinition(
		parentPath
	) as definition.Definition[]
	const size = parentDef?.length
	const enableBackward = !!index
	const enableForward = index !== null && size && index < size - 1

	const moveToIndex = (index: number) => {
		const toPath = `${parentPath}["${index}"]`

		// Selection Handling
		const suffix = component.path.getPathSuffix(path)
		const newSelectedPath = `${toPath}["${suffix}"]`
		uesio.builder.setActiveNode(newSelectedPath)
		uesio.view.moveDefinition(indexPath, toPath)
	}

	const onClickBackward = () => index && moveToIndex(index - 1)
	const onClickForward = () => index !== null && moveToIndex(index + 1)
	return (
		<>
			<ActionButton
				title="Move Backward"
				onClick={onClickBackward}
				icon={UpIcon}
				disabled={!enableBackward}
			/>
			<ActionButton
				title="Move Forward"
				onClick={onClickForward}
				icon={DownIcon}
				disabled={!enableForward}
			/>
		</>
	)
}

export default MoveActions
