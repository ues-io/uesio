import { definition, component, styles, context } from "@uesio/ui"
import {
	useSelectedComponentPath,
	setDragPath,
	getComponentDef,
	getBuilderNamespaces,
	useDragPath,
	setSelectedPath,
} from "../../api/stateapi"
import { useEffect, useRef } from "react"
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
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const selectedComponentPath = useSelectedComponentPath(context)

	const selectedChildren = useRef<Element[]>()
	const draggingChildren = useRef<Element[]>()

	const dragPath = useDragPath(context)
	const isDragging = dragPath.isSet()

	const [
		selectedChildIndex,
		selectedParentPath,
		selectedSlotPath,
		selectedComponentDef,
	] = getComponentInfoFromPath(selectedComponentPath, context)

	useEffect(() => {
		// Selected component handling
		if (selectedChildren?.current) {
			selectedChildren.current.forEach((child) => {
				child.classList.remove(...StyleDefaults.selected)
			})
		}

		if (!selectedSlotPath || isDragging) {
			selectedChildren.current = undefined
			return
		}

		selectedChildren.current = getTargetsFromSlotIndex(
			selectedSlotPath,
			selectedChildIndex
		)

		selectedChildren.current.forEach((target) => {
			target.classList.add(...StyleDefaults.selected)
			if (!target.classList.contains("absolute")) {
				target.classList.add(...StyleDefaults.selectedAlways)
			}
		})
	})

	useEffect(() => {
		// Dragging items handling
		const [draggingChildIndex, , draggingSlotPath, ,] =
			getComponentInfoFromPath(dragPath, context)

		if (draggingChildren?.current) {
			draggingChildren.current.forEach((child) => {
				child.classList.remove(...StyleDefaults.dragging)
			})
		}

		if (!draggingSlotPath) {
			draggingChildren.current = undefined
			return
		}

		draggingChildren.current = getTargetsFromSlotIndex(
			draggingSlotPath,
			draggingChildIndex
		)

		draggingChildren.current.forEach((target) => {
			target.classList.add(...StyleDefaults.dragging)
		})
	})

	if (!selectedChildren || !selectedParentPath || !selectedComponentDef)
		return null

	const nsInfo = getBuilderNamespaces(context)[selectedComponentDef.namespace]
	const componentTitle =
		selectedComponentDef.title || selectedComponentDef.name

	return !isDragging && selectedChildren?.current?.length ? (
		<Popper
			referenceEl={selectedChildren.current[0]}
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
					<NamespaceLabel
						metadatakey={selectedComponentDef.namespace}
						metadatainfo={nsInfo}
						title={componentTitle}
						context={context}
						classes={{
							root: classes.titletext,
						}}
					/>
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
