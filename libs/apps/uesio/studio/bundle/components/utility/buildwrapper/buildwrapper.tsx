import { FunctionComponent, SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"
import styling from "./styling"
import BuildActionsArea from "../../shared/buildproparea/buildactionsarea"
import getValueAPI from "../../shared/valueapi"

const Text = component.getUtility("uesio/io.text")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

const BuildWrapper: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { children, path = "", index = 0, definition, context } = props
	const [canDrag, setCanDrag] = useState(false)
	const viewDefId = uesio.getViewDefId()
	const viewDef = uesio.getViewDef()

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

	const valueAPI = getValueAPI(
		"viewdef",
		viewDefId,
		path,
		viewDef,
		uesio,
		context
	)

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
				<div
					data-placeholder="true"
					data-index={index}
					className={classes.placeholder}
				>
					<div className={classes.placeholderInner} />
				</div>
			)}
			<div
				data-index={index}
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
					<IOExpandPanel context={context} expanded={isSelected}>
						<BuildActionsArea
							context={context}
							path={path}
							valueAPI={valueAPI}
							propsDef={propDef}
							actions={propDef.actions}
						/>
					</IOExpandPanel>
				</div>
			</div>
			{addAfterPlaceholder && (
				<div
					data-placeholder="true"
					data-index={index + 1}
					className={styles.cx(
						classes.placeholder,
						classes.afterPlaceholder
					)}
				>
					<div className={classes.placeholderInner} />
				</div>
			)}
		</>
	)
}

export default BuildWrapper
