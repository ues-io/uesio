import { FunctionComponent, SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component, api } from "@uesio/ui"
import BuildActionsArea from "../../helpers/buildactionsarea"
import PlaceHolder from "../placeholder/placeholder"
import { getBuilderNamespaces } from "../../api/stateapi"

const SELECTED_COLOR = "#aaa"
const HOVER_COLOR = "#aaaaaaae"
const INACTIVE_COLOR = "#eee"

const BuildWrapper: FunctionComponent<definition.BaseProps> = (props) => {
	const Text = component.getUtility("uesio/io.text")
	const Popper = component.getUtility("uesio/io.popper")

	const { children, path = "", definition, context } = props
	const [canDrag, setCanDrag] = useState(false)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const viewDefId = context.getViewDefId()
	const viewDef = context.getViewDef()

	if (!viewDefId || !viewDef) return null

	const nodeState = api.builder.useNodeState("viewdef", viewDefId, path)
	const isActive = nodeState === "active"
	const isSelected = nodeState === "selected"
	const [propDef] = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath("viewdef", viewDefId, path)
	)

	if (!propDef) throw new Error("No Prop Def Provided")
	const accepts = propDef.accepts

	const [dragType, dragItem, dragPath] = api.builder.useDragNode()
	const [, , dropPath] = api.builder.useDropNode()
	const isDragging =
		path === dragPath && dragType === "viewdef" && dragItem === viewDefId

	const wrapperPath = component.path.getParentPath(path)
	const index = component.path.getIndexFromPath(path) || 0
	const componentKey = props.componentType

	if (!componentKey) throw new Error("Bad component key")

	//const valueAPI = getValueAPI("viewdef", viewDefId, path, viewDef)

	const [componentNamespace] = component.path.parseKey(componentKey)

	const title =
		componentKey === "uesio/core.view"
			? definition?.view || componentKey
			: propDef.title || "unknown"

	const nsInfo = getBuilderNamespaces(props.context)[componentNamespace]

	const addBeforePlaceholder = `${wrapperPath}["${index}"]` === dropPath
	const addAfterPlaceholder = `${wrapperPath}["${index + 1}"]` === dropPath
	const borderColor = (() => {
		if (isSelected) return SELECTED_COLOR
		if (isActive) return HOVER_COLOR
		return INACTIVE_COLOR
	})()
	const classes = styles.useUtilityStyles(
		{
			root: {
				cursor: "pointer",
				position: "relative",
				userSelect: "none",
				zIndex: isSelected ? 1 : 0,
				transition: "all 0.18s ease",
				"&:hover": {
					zIndex: 1,
				},
				...(isDragging && {
					display: "none",
				}),
				padding: "6px",
			},
			wrapper: {
				border: `1px solid ${borderColor}`,
				borderRadius: "4px",
				overflow: "hidden",
			},
			header: {
				color: "#333",
				backgroundColor: isSelected ? "white" : "transparent",
				padding: "10px 10px 2px",
				textTransform: "uppercase",
				fontSize: "8pt",
			},
			popper: {
				width: "auto",
				border: "1px solid #ddd",
				borderRadius: "8px",
				boxShadow: "0 0 12px #00000033",
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
				data-accepts={accepts?.join(",")}
				data-path={path}
				onDragStart={(e: DragEvent) => {
					// We do this because we don't want
					// this component to always be draggable
					// that's why we do the setCanDrag thing
					e.stopPropagation()
					setTimeout(() => {
						if (dragPath !== path) {
							api.builder.setDragNode("viewdef", viewDefId, path)
						}
					})
				}}
				onDragEnd={() => {
					api.builder.clearDragNode()
					api.builder.clearDropNode()
				}}
				className={classes.root}
				onClick={(event: SyntheticEvent) => {
					!isSelected &&
						api.builder.setSelectedNode("viewdef", viewDefId, path)
					event.stopPropagation()
				}}
				onMouseEnter={() => {
					!isActive &&
						api.builder.setActiveNode("viewdef", viewDefId, path)
				}}
				onMouseLeave={() => {
					isActive && api.builder.clearActiveNode()
				}}
				draggable={canDrag}
			>
				{isSelected && (
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
								wrapper: classes.popperInner,
							}}
							// path={path}
							// valueAPI={valueAPI}
							// propsDef={propDef}
							// actions={propDef.actions}
						/>
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
							<span className={classes.titletext}>{title}</span>
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
