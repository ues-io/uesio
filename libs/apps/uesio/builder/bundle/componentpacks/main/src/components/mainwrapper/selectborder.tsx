import { definition, component, styles } from "@uesio/ui"
import { useSelectedComponentPath } from "../../api/stateapi"
import { useEffect, useState } from "react"
import { FullPath } from "../../api/path"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import CloneAction from "../../actions/cloneaction"

const StyleDefaults = Object.freeze({
	selected: ["outline", "outline-2", "outline-blue-600"],
	popper: ["bg-blue-600", "rounded"],
})

const SelectBorder: definition.UtilityComponent = (props) => {
	const context = props.context

	const Popper = component.getUtility("uesio/io.popper")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const selectedComponentPath = useSelectedComponentPath(context)

	const [selectedChild, setSelectedChild] = useState<Element>()

	let selectedChildIndex = 0
	let selectedParentPath: FullPath | undefined = undefined
	let selectedSlotPath: FullPath | undefined = undefined

	const viewDefId = context.getViewDefId()

	if (
		selectedComponentPath.isSet() &&
		selectedComponentPath.itemType === "viewdef" &&
		selectedComponentPath.itemName === viewDefId
	) {
		selectedParentPath = selectedComponentPath.parent()
		const [componentIndex, restOfPath] = selectedParentPath.popIndex()
		selectedChildIndex = componentIndex
		selectedSlotPath = restOfPath
	}

	useEffect(() => {
		if (selectedChild) {
			selectedChild.classList.remove(...StyleDefaults.selected)
		}

		if (!selectedSlotPath) {
			setSelectedChild(undefined)
			return
		}
		const parentElem = document.querySelector(
			`[data-path="${CSS.escape(selectedSlotPath.localPath)}"]`
		)
		if (!parentElem) {
			setSelectedChild(undefined)
			return
		}

		let index = 0
		for (const child of Array.from(parentElem.children)) {
			// If the child was a placeholder, and not a real component
			// in this slot, we can skip it.
			if (child.getAttribute("data-placeholder") === "true") continue

			if (index === selectedChildIndex) {
				// We found our correct child ref.
				child.classList.add(...StyleDefaults.selected)
				setSelectedChild(child)
			}
			index++
		}
	}, [selectedSlotPath, selectedChildIndex, selectedChild])

	return (
		<>
			{selectedChild && selectedParentPath && (
				<Popper
					referenceEl={selectedChild}
					context={context}
					placement="top"
					offset={8}
					classes={{
						popper: classes.popper,
					}}
				>
					<DeleteAction context={context} path={selectedParentPath} />
					<MoveActions context={context} path={selectedParentPath} />
					<CloneAction context={context} path={selectedParentPath} />
				</Popper>
			)}
		</>
	)
}

export default SelectBorder
