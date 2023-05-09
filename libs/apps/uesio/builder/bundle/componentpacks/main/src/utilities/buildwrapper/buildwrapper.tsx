import { definition } from "@uesio/ui"
import PlaceHolder from "../placeholder/placeholder"
import { useDragPath, useDropPath } from "../../api/stateapi"
import { FullPath } from "../../api/path"

const BuildWrapper: definition.UC = (props) => {
	const { children, path, context } = props

	const dragPath = useDragPath(context)
	const dropPath = useDropPath(context)

	const viewDefId = context.getViewDefId()
	const fullPath = new FullPath("viewdef", viewDefId, path)

	const [, index, slotPath] = fullPath.popIndexAndType()
	const isDraggingMe = dragPath.equals(fullPath)

	let addBeforePlaceholder,
		addAfterPlaceholder = false

	if (dropPath.isSet() && dropPath.size() > 1) {
		const [dropIndex, dropSlotPath] = dropPath.popIndex()
		const isDroppingInMySlot = slotPath.equals(dropSlotPath)
		if (isDroppingInMySlot) {
			if (index === 0 && dropIndex === 0) addBeforePlaceholder = true
			if (dropIndex === index + 1) addAfterPlaceholder = true
		}
	}

	return (
		<>
			{addBeforePlaceholder && (
				<PlaceHolder label="0" isHovering={true} context={context} />
			)}
			{isDraggingMe ? <div className="hidden" /> : children}
			{addAfterPlaceholder && (
				<PlaceHolder
					label={index + 1 + ""}
					isHovering={true}
					context={context}
				/>
			)}
		</>
	)
}

export default BuildWrapper
