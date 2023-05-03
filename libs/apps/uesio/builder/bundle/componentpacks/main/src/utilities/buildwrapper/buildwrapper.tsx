import { definition, styles, component } from "@uesio/ui"
import PlaceHolder from "../placeholder/placeholder"
import {
	getBuilderNamespaces,
	getComponentDef,
	useDragPath,
	useDropPath,
} from "../../api/stateapi"
import { FullPath } from "../../api/path"

const BuildWrapper: definition.UC = (props) => {
	const Text = component.getUtility("uesio/io.text")

	const { children, path, context, componentType } = props

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
	const [index, grandparent] = parent.popIndex()

	const isDragging = dragPath.equals(fullPath)
	const addBeforePlaceholder = grandparent
		.addLocal("" + index)
		.equals(dropPath)
	const addAfterPlaceholder = grandparent
		.addLocal("" + (index + 1))
		.equals(dropPath)

	const classes = styles.useUtilityStyles(
		{
			root: {
				cursor: "pointer",
				position: "relative",
				userSelect: "none",
				...(isDragging && {
					display: "none",
				}),
				border: "1px solid #eee",
				borderRadius: "4px",
				overflow: "hidden",
				margin: "6px",
			},
			header: {
				color: "#444",
				backgroundColor: "transparent",
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
				fontWeight: 300,
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
					data-placeholder="true"
				/>
			)}
			<div className={classes.root}>
				<div className={classes.header}>
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
				<div className={classes.inner}>{children}</div>
			</div>
			{addAfterPlaceholder && (
				<PlaceHolder
					label={""}
					index={index + 1}
					isHovering={true}
					context={context}
					hideIfNotLast={true}
					data-placeholder="true"
				/>
			)}
		</>
	)
}

export default BuildWrapper
