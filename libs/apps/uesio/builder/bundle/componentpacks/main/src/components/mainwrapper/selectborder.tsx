import { definition, component, styles, context } from "@uesio/ui"
import {
	useSelectedComponentPath,
	setDragPath,
	getComponentDef,
	getBuilderNamespaces,
	useDragPath,
	setSelectedPath,
} from "../../api/stateapi"
import { useEffect, useState } from "react"
import { FullPath } from "../../api/path"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import CloneAction from "../../actions/cloneaction"

const StyleDefaults = Object.freeze({
	header: [
		"bg-white",
		"flex",
		"items-center",
		"text-xxs",
		"m-0.5",
		"gap-1",
		"p-1.5",
		"rounded-sm",
		"font-light",
		"uppercase",
		"leading-none",
		"cursor-grab",
	],
	titletext: ["grow"],
	actionarea: ["text-white"],
	closebutton: ["text-slate-700", "p-0", "m-0"],
	selected: [
		"after:absolute",
		"after:inset-0",
		"after:pointer-events-none",
		"after:outline-dashed",
		"after:outline-2",
		"after:outline-blue-600",
		"after:-outline-offset-[2px]",
	],
	selectedAlways: ["relative"],
	arrow: ["fill-blue-600"],
	popper: ["bg-blue-600", "rounded"],
	dragging: ["opacity-20"],
})

const getComponentInfoFromPath = (path: FullPath, context: context.Context) => {
	const isValid =
		path.isSet() &&
		path.itemType === "viewdef" &&
		path.itemName === context.getViewDefId() &&
		path.localPath &&
		path.size() > 1
	if (!isValid) {
		return [undefined, undefined, undefined, undefined] as const
	}
	const [componentType, parentPath] = path.pop()
	const [componentIndex, grandParentPath] = parentPath.popIndex()
	const componentDef = getComponentDef(context, componentType)
	return [componentIndex, parentPath, grandParentPath, componentDef] as const
}

const getTargetFromSlotIndex = (slotPath: FullPath, index: number) => {
	const indexPlaceHolder = document.querySelector(
		`[data-path="${CSS.escape(
			slotPath.localPath
		)}"]>[data-index="${index}"]`
	)

	if (!indexPlaceHolder) {
		return null
	}

	const target = indexPlaceHolder.nextSibling as Element | null
	if (!target) {
		return null
	}

	// If the next sibling is a placeholder, we have a problem.
	// most likely the component we were trying to render didn't
	// return a dom element.
	if (target.getAttribute("data-placeholder") === "true") {
		console.log("problem selecting item!")
		return null
	}

	return target
}

const SelectBorder: definition.UtilityComponent = (props) => {
	const context = props.context

	const Popper = component.getUtility("uesio/io.popper")
	const Text = component.getUtility("uesio/io.text")
	const IconButton = component.getUtility("uesio/io.iconbutton")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const selectedComponentPath = useSelectedComponentPath(context)

	const [selectedChild, setSelectedChild] = useState<Element>()
	const [draggingChild, setDraggingChild] = useState<Element>()

	const dragPath = useDragPath(context)
	const isDragging = dragPath.isSet()

	const [
		selectedChildIndex,
		selectedParentPath,
		selectedSlotPath,
		selectedComponentDef,
	] = getComponentInfoFromPath(selectedComponentPath, context)

	// Handle figuring out what the selected element is so that we can
	// Add some styling to it.
	useEffect(() => {
		if (selectedChild) {
			selectedChild.classList.remove(...StyleDefaults.selected)
		}

		if (!selectedSlotPath || isDragging) {
			setSelectedChild(undefined)
			return
		}

		const target = getTargetFromSlotIndex(
			selectedSlotPath,
			selectedChildIndex
		)

		if (!target) {
			setSelectedChild(undefined)
			return
		}

		target.classList.add(...StyleDefaults.selected)
		target.classList.add(...StyleDefaults.selectedAlways)
		setSelectedChild(target)
	}, [selectedSlotPath, selectedChildIndex, selectedChild, isDragging])

	const [draggingChildIndex, , draggingSlotPath, ,] =
		getComponentInfoFromPath(dragPath, context)

	// Handle figuring out what the dragging element is so that we can
	// Add some styling to it.
	useEffect(() => {
		if (draggingChild) {
			draggingChild.classList.remove(...StyleDefaults.dragging)
		}

		if (!draggingSlotPath) {
			setDraggingChild(undefined)
			return
		}

		const target = getTargetFromSlotIndex(
			draggingSlotPath,
			draggingChildIndex
		)

		if (!target) {
			setDraggingChild(undefined)
			return
		}

		// We found our correct child ref.
		target.classList.add(...StyleDefaults.dragging)
		setDraggingChild(target)
	}, [draggingSlotPath, draggingChildIndex, draggingChild])

	if (!selectedChild || !selectedParentPath || !selectedComponentDef)
		return null

	const nsInfo = getBuilderNamespaces(context)[selectedComponentDef.namespace]
	const componentTitle =
		selectedComponentDef.title || selectedComponentDef.name

	return isDragging ? null : (
		<Popper
			referenceEl={selectedChild}
			context={context}
			placement="top"
			offset={8}
			arrow={true}
			classes={classes}
		>
			<div>
				<div
					className={classes.header}
					draggable
					onDragStart={() => {
						setTimeout(() => {
							setDragPath(context, selectedComponentPath)
						})
					}}
					onDragEnd={() => {
						setDragPath(context)
					}}
				>
					<Text
						variant="uesio/io.icon"
						text={nsInfo.icon}
						color={nsInfo.color}
						context={context}
					/>
					<span className={classes.titletext}>{componentTitle}</span>
					<IconButton
						context={context}
						variant="uesio/builder.buildtitle"
						className={classes.closebutton}
						icon="close"
						onClick={() => setSelectedPath(context)}
					/>
				</div>
				<div className={classes.actionarea}>
					<DeleteAction context={context} path={selectedParentPath} />
					<MoveActions context={context} path={selectedParentPath} />
					<CloneAction context={context} path={selectedParentPath} />
				</div>
			</div>
		</Popper>
	)
}

export default SelectBorder
