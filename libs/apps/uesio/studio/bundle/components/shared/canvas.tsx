import { FunctionComponent, DragEvent } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"
import { getDropIndex, handleDrop, isDropAllowed, isNextSlot } from "./dragdrop"
import PanelPortal from "./panelportal"

const Icon = component.getUtility("uesio/io.icon")

const getIndex = (
	target: Element | null,
	prevTarget: Element | null,
	e: DragEvent
): number => {
	if (!prevTarget) {
		const dataInsertIndex = target?.getAttribute("data-insertindex")
		return dataInsertIndex ? parseInt(dataInsertIndex, 10) : 0
	}
	const dataIndex = prevTarget.getAttribute("data-index")
	const dataPlaceholder = prevTarget.getAttribute("data-placeholder")
	const dataDirection = target?.getAttribute("data-direction")

	if (!dataIndex) return 0
	const index = parseInt(dataIndex, 10)
	if (dataPlaceholder === "true") {
		return index
	}
	const bounds = prevTarget.getBoundingClientRect()
	return isNextSlot(bounds, dataDirection || "vertical", e.pageX, e.pageY)
		? index + 1
		: index
}

const Canvas: FunctionComponent<definition.UtilityProps> = (props) => {
	const context = props.context
	const classes = styles.useUtilityStyles(
		{
			root: {
				overflowY: "scroll",
				padding: "60px",
				...styles.getBackgroundStyles(
					{
						image: "uesio/core.whitesplash",
					},
					context.getTheme(),
					context
				),
			},

			inner: {
				background: "white",
				minHeight: "100vh",
				padding: "0.05px", // Hack to prevent margin collapse
				position: "relative",
			},

			noContent: {
				display: "flex",
				height: "100%",
				position: "absolute",
				inset: "15px",
				justifyContent: "center",
				alignItems: "center",

				".icon": {
					fontFamily: "Material Icons",
					fontSize: "2em",
					marginBottom: "0.5em",
				},
				".text": {
					marginTop: 0,
					fontWeight: 300,
					color: "#444",
				},

				".quote": {
					marginTop: "2em",
					opacity: 0.5,
					h4: {
						marginBottom: "0.25em",
					},
					p: {
						marginTop: 0,
						fontSize: "0.8em",
					},
				},

				".inner": {
					textAlign: "center",
					border: "1px dashed rgba(238, 238, 238)",
					padding: "2em",
					borderRadius: "2em",
				},
			},
		},
		props
	)

	const uesio = hooks.useUesio(props)

	const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
	const [, , dropPath] = uesio.builder.useDropNode()
	const fullDragPath = component.path.makeFullPath(
		dragType,
		dragItem,
		dragPath
	)

	const viewDefId = context.getViewDefId()
	const viewDef = context.getViewDef()
	const route = context.getRoute()

	if (!route || !viewDefId) return null

	const componentCount = viewDef?.components?.length

	// Handle the situation where a draggable leaves the canvas.
	// If the cursor is outside of the canvas's bounds, then clear
	// out the drop node.
	const onDragLeave = (e: DragEvent) => {
		if (e.target === e.currentTarget) {
			uesio.builder.clearDropNode()
		} else {
			const currentTarget = e.currentTarget as HTMLDivElement
			const bounds = currentTarget.getBoundingClientRect()
			const outsideLeft = e.pageX < bounds.left
			const outsideRight = e.pageX > bounds.right
			const outsideTop = e.pageY < bounds.top
			const outsideBottom = e.pageY > bounds.bottom
			if (outsideLeft || outsideRight || outsideTop || outsideBottom) {
				uesio.builder.clearDropNode()
			}
		}
	}
	// Handle the situation where no other slots are accepting draggable
	// items. This clears out the current drop node so that our slot
	// acceptance indicators go away.
	const onDragOver = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()

		let target = e.target as Element | null
		let prevTarget = null as Element | null
		let validPath = ""
		while (target !== null && target !== e.currentTarget) {
			const accepts = target.getAttribute("data-accepts")?.split(",")
			if (accepts && isDropAllowed(accepts, fullDragPath)) {
				validPath = target.getAttribute("data-path") || ""
				break
			}
			prevTarget = target
			target = target.parentElement || null
		}

		if (validPath) {
			const index = getIndex(target, prevTarget, e)
			let usePath = `${validPath}["${index}"]`
			if (usePath === component.path.getParentPath(dragPath)) {
				// Don't drop on ourselfs, just move to the next index
				usePath = `${validPath}["${index + 1}"]`
			}
			if (dropPath !== usePath) {
				uesio.builder.setDropNode("viewdef", viewDefId, usePath)
			}
			return
		}

		if (dropPath !== "") {
			uesio.builder.clearDropNode()
		}
	}

	const onDrop = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!dropPath) {
			return
		}
		const index = component.path.getIndexFromPath(dropPath) || 0
		const fullDropPath = component.path.makeFullPath(
			"viewdef",
			viewDefId,
			component.path.getParentPath(dropPath)
		)
		handleDrop(
			fullDragPath,
			fullDropPath,
			getDropIndex(fullDragPath, fullDropPath, index),
			uesio
		)
	}

	return (
		<div
			onDragLeave={onDragLeave}
			onDragOver={onDragOver}
			onDrop={onDrop}
			className={classes.root}
		>
			<div
				className={classes.inner}
				data-accepts="uesio.standalone"
				data-path={'["components"]'}
				data-insertindex={componentCount}
			>
				{/* No content yet */}
				{!componentCount && (
					<div className={classes.noContent}>
						<div className="inner">
							<Icon
								className="icon"
								icon={"flip_to_back"}
								context={context}
							/>
							<h4 className="text">
								Drag and drop any component here to get started
							</h4>
						</div>
					</div>
				)}
				{props.children}

				<PanelPortal context={context} />
			</div>
		</div>
	)
}
Canvas.displayName = "Canvas"

export default Canvas
