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
	empty: [
		"bg-blue-50",
		"py-2",
		"px-3",
		"my-1",
		"text-blue-400",
		"text-[8pt]",
		"font-light",
		"rounded",
		"uppercase",
		"before:content-[attr(data-empty-label)]",
	],
	emptyRemove: ["contents"],
})

const nonComponentPaths = ["wires", "params"]

const getComponentInfoFromPath = (path: FullPath, context: context.Context) => {
	const isValid =
		path.isSet() &&
		path.itemType === "viewdef" &&
		path.itemName === context.getViewDefId() &&
		path.localPath &&
		path.size() > 1 &&
		!nonComponentPaths.includes(path.trimToSize(1).pop()[0] as string)
	if (!isValid) {
		return [undefined, undefined, undefined, undefined] as const
	}
	const [componentType, parentPath] = path.pop()
	const [componentIndex, grandParentPath] = parentPath.popIndex()
	const componentDef = getComponentDef(componentType)
	return [componentIndex, parentPath, grandParentPath, componentDef] as const
}

const getTargetsFromSlotIndex = (slotPath: FullPath, index: number) => {
	const targetWrappers = document.querySelectorAll(
		`[data-path="${CSS.escape(
			slotPath.localPath
		)}"]>[data-index="${index}"]`
	)
	const targets: Element[] = []
	targetWrappers.forEach((target) => {
		const children = target.querySelectorAll(
			":scope>:not([data-placeholder])"
		)
		if (children.length) {
			children.forEach((child) => {
				targets.push(child)
			})
			return null
		}
		target.classList.remove("contents")
		targets.push(target)
	})
	return targets
}

type Props = {
	viewdef: definition.DefinitionMap
}

const SelectBorder: definition.UtilityComponent<Props> = (props) => {
	const context = props.context

	const Popper = component.getUtility("uesio/io.popper")
	const Text = component.getUtility("uesio/io.text")
	const IconButton = component.getUtility("uesio/io.iconbutton")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const selectedComponentPath = useSelectedComponentPath(context)

	const [selectedChildren, setSelectedChildren] = useState<Element[]>()
	const [draggingChildren, setDraggingChildren] = useState<Element[]>()
	const [emptyComponents, setEmptyComponents] =
		useState<NodeListOf<Element>>()

	const selectedLength = selectedChildren ? selectedChildren.length : 0
	const draggingLength = draggingChildren ? draggingChildren.length : 0

	const dragPath = useDragPath(context)
	const isDragging = dragPath.isSet()

	const [
		selectedChildIndex,
		selectedParentPath,
		selectedSlotPath,
		selectedComponentDef,
	] = getComponentInfoFromPath(selectedComponentPath, context)

	const selectedSlotPathString = selectedSlotPath?.combine() || ""

	useEffect(() => {
		if (emptyComponents) {
			emptyComponents.forEach((child) => {
				child.classList.remove(...StyleDefaults.empty)
				child.classList.add(...StyleDefaults.emptyRemove)
				child.setAttribute("data-placeholder", "true")
			})
		}
		const targets = document.querySelectorAll(
			`[data-path]>[data-component]:empty`
		)

		if (!targets.length) {
			setEmptyComponents(undefined)
			return
		}

		targets.forEach((target) => {
			target.classList.add(...StyleDefaults.empty)
			target.classList.remove(...StyleDefaults.emptyRemove)
			target.removeAttribute("data-placeholder")
		})

		setEmptyComponents(targets)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.viewdef])

	// Handle figuring out what the selected element is so that we can
	// Add some styling to it.
	useEffect(() => {
		if (selectedChildren) {
			selectedChildren.forEach((child) => {
				child.classList.remove(...StyleDefaults.selected)
			})
		}

		if (!selectedSlotPath || isDragging) {
			setSelectedChildren(undefined)
			return
		}

		const targets = getTargetsFromSlotIndex(
			selectedSlotPath,
			selectedChildIndex
		)

		if (!targets) {
			setSelectedChildren(undefined)
			return
		}

		targets.forEach((target) => {
			target.classList.add(...StyleDefaults.selected)
			if (!target.classList.contains("absolute")) {
				target.classList.add(...StyleDefaults.selectedAlways)
			}
		})

		setSelectedChildren(targets)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedSlotPathString, selectedChildIndex, selectedLength, isDragging])

	const [draggingChildIndex, , draggingSlotPath, ,] =
		getComponentInfoFromPath(dragPath, context)

	const draggingSlotPathString = draggingSlotPath?.combine() || ""

	// Handle figuring out what the dragging element is so that we can
	// Add some styling to it.
	useEffect(() => {
		if (draggingChildren) {
			draggingChildren.forEach((child) => {
				child.classList.remove(...StyleDefaults.dragging)
			})
		}

		if (!draggingSlotPath) {
			setDraggingChildren(undefined)
			return
		}

		const targets = getTargetsFromSlotIndex(
			draggingSlotPath,
			draggingChildIndex
		)

		if (!targets) {
			setDraggingChildren(undefined)
			return
		}

		targets.forEach((target) => {
			target.classList.add(...StyleDefaults.dragging)
		})
		setDraggingChildren(targets)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [draggingSlotPathString, draggingChildIndex, draggingLength])

	if (!selectedChildren || !selectedParentPath || !selectedComponentDef)
		return null

	const nsInfo = getBuilderNamespaces(context)[selectedComponentDef.namespace]
	const componentTitle =
		selectedComponentDef.title || selectedComponentDef.name

	return !isDragging && selectedChildren?.length ? (
		<Popper
			referenceEl={selectedChildren[0]}
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
					<CloneAction
						context={context}
						path={selectedParentPath}
						purgeProperties={[component.COMPONENT_ID]}
					/>
				</div>
			</div>
		</Popper>
	) : null
}

export default SelectBorder
