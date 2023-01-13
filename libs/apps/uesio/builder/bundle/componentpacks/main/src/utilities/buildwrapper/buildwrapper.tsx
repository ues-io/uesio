import { SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component } from "@uesio/ui"
import BuildActionsArea from "../../helpers/buildactionsarea"
import PlaceHolder from "../placeholder/placeholder"
import {
	FullPath,
	getBuilderNamespaces,
	getComponentDef,
	useDragPath,
	useDropPath,
	useSelectedPath,
} from "../../api/stateapi"

const BuildWrapper: definition.UC = (props) => {
	const Text = component.getUtility("uesio/io.text")
	const Popper = component.getUtility("uesio/io.popper")

	const { children, path, context, componentType } = props
	const [canDrag, setCanDrag] = useState(false)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

	const viewDefId = context.getViewDefId()
	const [selectedPath, setSelected] = useSelectedPath(context)
	const [dragPath, setDragPath] = useDragPath(context)
	const [dropPath, setDropPath] = useDropPath(context)

	const fullPath = new FullPath("viewdef", viewDefId, path)

	const selected = selectedPath.equals(fullPath)

	const componentDef = getComponentDef(context, componentType)

	if (!componentType || !componentDef) return <>{children}</>

	const accepts = ["uesio.standalone"]

	const isDragging = dragPath.equals(fullPath)

	const wrapperPath = component.path.getParentPath(path)
	const index = component.path.getIndexFromPath(path) || 0

	const [componentNamespace] = component.path.parseKey(componentType)

	const nsInfo = getBuilderNamespaces(context)[componentNamespace]

	const addBeforePlaceholder =
		`${wrapperPath}["${index}"]` === dropPath.localPath
	const addAfterPlaceholder =
		`${wrapperPath}["${index + 1}"]` === dropPath.localPath

	const classes = styles.useUtilityStyles(
		{
			root: {
				cursor: "pointer",
				position: "relative",
				userSelect: "none",
				zIndex: selected ? 1 : 0,
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
					if (dragPath.equals(fullPath)) {
						setTimeout(() => {
							setDragPath(fullPath)
						})
					}
				}}
				onDragEnd={() => {
					setDropPath()
					setDragPath()
				}}
				className={classes.root}
				onClick={(event: SyntheticEvent) => {
					!selected && setSelected(fullPath)
					event.stopPropagation()
				}}
				draggable={canDrag}
			>
				{selected && (
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
