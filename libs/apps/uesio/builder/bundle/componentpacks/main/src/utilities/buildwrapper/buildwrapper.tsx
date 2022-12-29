import { FunctionComponent, SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"
import styling from "./styling"
import BuildActionsArea from "../../shared/buildproparea/buildactionsarea"
import getValueAPI from "../../shared/valueapi"
import PlaceHolder from "../placeholder/placeholder"

const Text = component.getUtility("uesio/io.text")

const Popper = component.getUtility("uesio/io.popper")

const BuildWrapper: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { children, path = "", index = 0, definition, context } = props
	const [canDrag, setCanDrag] = useState(false)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const viewDefId = context.getViewDefId()
	const viewDef = context.getViewDef()

	if (!viewDefId || !viewDef) return null

	const nodeState = uesio.builder.useNodeState("viewdef", viewDefId, path)
	const isActive = nodeState === "active"
	const isSelected = nodeState === "selected"
	const [propDef] = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath("viewdef", viewDefId, path),
		viewDef
	)

	if (!propDef) throw new Error("No Prop Def Provided")
	const accepts = propDef.accepts

	const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
	const [, , dropPath] = uesio.builder.useDropNode()
	const isDragging =
		path === dragPath && dragType === "viewdef" && dragItem === viewDefId

	const wrapperPath = component.path.getGrandParentPath(path)
	const componentKey = component.path.getKeyAtPath(path)

	if (!componentKey) throw new Error("Bad component key")

	const valueAPI = getValueAPI("viewdef", viewDefId, path, viewDef)

	const [componentNamespace] = component.path.parseKey(componentKey)

	const title =
		componentKey === "uesio/core.view"
			? definition?.view || componentKey
			: propDef.title || "unknown"

	const nsInfo = uesio.builder.getNamespaceInfo(componentNamespace)

	const addBeforePlaceholder = `${wrapperPath}["${index}"]` === dropPath
	const addAfterPlaceholder = `${wrapperPath}["${index + 1}"]` === dropPath
	const classes = styles.useUtilityStyles(
		styling(isSelected, isActive, isDragging),
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
							uesio.builder.setDragNode(
								"viewdef",
								viewDefId,
								path
							)
						}
					})
				}}
				onDragEnd={() => {
					uesio.builder.clearDragNode()
					uesio.builder.clearDropNode()
				}}
				className={classes.root}
				onClick={(event: SyntheticEvent) => {
					!isSelected &&
						uesio.builder.setSelectedNode(
							"viewdef",
							viewDefId,
							path
						)
					event.stopPropagation()
				}}
				onMouseEnter={() => {
					!isActive &&
						uesio.builder.setActiveNode("viewdef", viewDefId, path)
				}}
				onMouseLeave={() => {
					isActive && uesio.builder.clearActiveNode()
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
							path={path}
							valueAPI={valueAPI}
							propsDef={propDef}
							actions={propDef.actions}
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
