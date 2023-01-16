import { SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component } from "@uesio/ui"
import BuildActionsArea from "../../helpers/buildactionsarea"
import PlaceHolder from "../placeholder/placeholder"
import {
	getBuilderNamespaces,
	getComponentDef,
	setDragPath,
	setDropPath,
	setSelectedPath,
	useDragPath,
	useDropPath,
	useSelectedPath,
} from "../../api/stateapi"
import { FullPath } from "../../api/path"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import CloneAction from "../../actions/cloneaction"

const BuildWrapper: definition.UC = (props) => {
	const Text = component.getUtility("uesio/io.text")
	const Popper = component.getUtility("uesio/io.popper")

	const { children, path, context, componentType } = props
	const [canDrag, setCanDrag] = useState(false)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

	const selectedPath = useSelectedPath(context)
	const dragPath = useDragPath(context)
	const dropPath = useDropPath(context)

	const componentDef = getComponentDef(context, componentType)

	if (!componentType || !componentDef) return <>{children}</>

	const [componentNamespace] = component.path.parseKey(componentType)
	const nsInfo = getBuilderNamespaces(context)[componentNamespace]

	const viewDefId = context.getViewDefId()
	const fullPath = new FullPath("viewdef", viewDefId, path)

	// Get the path without the component type portion
	// from: ["components"]["0"]["mycomponent"]
	// to:   ["components"]["0"]
	const parent = fullPath.parent()
	const [trueindex, grandparent] = parent.popIndex()

	// Special handling for sibling records where the item being dragged
	// has a lower index than this item. We need the item being dragged
	// to not take up a spot so we reduce the index by one.
	let index = trueindex
	if (dragPath.isSet() && dragPath.itemType === "viewdef") {
		const [dragIndex, dragParent] = dragPath.parent().popIndex()
		if (dragParent.equals(grandparent) && dragIndex < index) index--
	}

	const isDragging = dragPath.equals(fullPath)
	const addBeforePlaceholder = grandparent
		.addLocal("" + index)
		.equals(dropPath)
	const addAfterPlaceholder = grandparent
		.addLocal("" + (index + 1))
		.equals(dropPath)

	// We are considered selected if the seleced path is either
	// ["components"]["0"]["mycomponent"] or ["components"]["0"]
	const selected =
		selectedPath.equals(fullPath) || selectedPath.equals(parent)

	const classes = styles.useUtilityStyles(
		{
			root: {
				cursor: "pointer",
				position: "relative",
				userSelect: "none",
				transition: "all 0.18s ease",
				...(isDragging && {
					display: "none",
				}),
				"&:active > div": {
					backgroundColor: "white",
				},
				padding: "6px",
			},
			wrapper: {
				border: `1px solid ${selected ? "#aaa" : "#eee"}`,
				borderRadius: "4px",
				overflow: "hidden",
			},
			header: {
				color: "#333",
				backgroundColor: selected ? "white" : "transparent",
				padding: "10px 10px 2px",
				textTransform: "uppercase",
				fontSize: "8pt",
			},
			popper: {
				width: "auto",
				border: "1px solid #ddd",
				borderRadius: "8px",
				boxShadow: "0 0 8px #00000020",
			},
			popperInner: {
				borderRadius: "7px",
			},
			inner: {
				padding: "8px",
				position: "relative",
				overflow: "auto",
			},
			titleicon: {
				marginRight: "4px",
			},
			titletext: {
				verticalAlign: "middle",
			},
		},
		props
	)
	return (
		<>
			{addBeforePlaceholder && (
				<PlaceHolder
					label={""}
					index={index}
					isHovering={true}
					context={context}
				/>
			)}
			<div
				data-index={index}
				ref={setAnchorEl}
				data-accepts={[].join(",")}
				data-path={path}
				onDragStart={(e: DragEvent) => {
					// We do this because we don't want
					// this component to always be draggable
					// that's why we do the setCanDrag thing
					e.stopPropagation()
					if (!dragPath.equals(fullPath)) {
						setTimeout(() => {
							setDragPath(context, fullPath)
						})
					}
				}}
				onDragEnd={() => {
					setDropPath(context)
					setDragPath(context)
				}}
				className={classes.root}
				onClick={(event: SyntheticEvent) => {
					!selected && setSelectedPath(context, fullPath)
					event.stopPropagation()
				}}
				draggable={canDrag}
			>
				{selected && !dragPath.isSet() && (
					<Popper
						referenceEl={anchorEl}
						context={context}
						placement="top"
						classes={{
							popper: classes.popper,
						}}
						offset={[0, 0]}
					>
						<BuildActionsArea
							context={context}
							classes={{
								root: classes.popperInner,
							}}
						>
							<DeleteAction context={context} path={parent} />
							<MoveActions context={context} path={parent} />
							<CloneAction context={context} path={parent} />
						</BuildActionsArea>
					</Popper>
				)}
				<div className={classes.wrapper}>
					{
						<div
							className={classes.header}
							onMouseDown={() => setCanDrag(true)}
							onMouseUp={() => dragPath && setCanDrag(false)}
						>
							<Text
								variant="uesio/io.icon"
								className={classes.titleicon}
								text={nsInfo.icon}
								color={nsInfo.color}
								context={context}
							/>
							<span className={classes.titletext}>
								{componentDef.title || componentDef.name}
							</span>
						</div>
					}
					<div className={classes.inner}>{children}</div>
				</div>
			</div>
			{addAfterPlaceholder && (
				<PlaceHolder
					label={""}
					index={index + 1}
					isHovering={true}
					context={context}
					hideIfNotLast={true}
				/>
			)}
		</>
	)
}

export default BuildWrapper
