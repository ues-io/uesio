import { definition, component, styles } from "@uesio/ui"
import {
	useSelectedComponentPath,
	setDragPath,
	ComponentDef,
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
	selected: ["outline-dashed", "outline-2", "outline-blue-600"],
	arrow: ["fill-blue-600"],
	popper: ["bg-blue-600", "rounded"],
})

const SelectBorder: definition.UtilityComponent = (props) => {
	const context = props.context

	const Popper = component.getUtility("uesio/io.popper")
	const Text = component.getUtility("uesio/io.text")
	const IconButton = component.getUtility("uesio/io.iconbutton")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const selectedComponentPath = useSelectedComponentPath(context)

	const [selectedChild, setSelectedChild] = useState<Element>()

	const isDragging = useDragPath(context).isSet()

	let selectedChildIndex = 0
	let selectedParentPath: FullPath | undefined = undefined
	let selectedSlotPath: FullPath | undefined = undefined
	let selectedComponentDef: ComponentDef | undefined = undefined

	const viewDefId = context.getViewDefId()

	if (
		selectedComponentPath.isSet() &&
		selectedComponentPath.itemType === "viewdef" &&
		selectedComponentPath.itemName === viewDefId &&
		selectedComponentPath.localPath &&
		selectedComponentPath.size() > 1
	) {
		const [componentType, parentPath] = selectedComponentPath.pop()
		const [componentIndex, grandParentPath] = parentPath.popIndex()
		selectedChildIndex = componentIndex
		selectedParentPath = parentPath
		selectedSlotPath = grandParentPath
		selectedComponentDef = getComponentDef(context, componentType)
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

			if (index === selectedChildIndex && !isDragging) {
				// We found our correct child ref.
				child.classList.add(...StyleDefaults.selected)
				setSelectedChild(child)
			}
			index++
		}
	}, [selectedSlotPath, selectedChildIndex, selectedChild, isDragging])

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
			<div data-actionbar="true">
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
