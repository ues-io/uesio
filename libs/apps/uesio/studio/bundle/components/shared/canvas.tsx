import { FunctionComponent, DragEvent, useState, useRef } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"
import { handleDrop, isDropAllowed, isNextSlot } from "./dragdrop"
import PanelPortal from "./panelportal"
import TopActions from "./topactions"
import BottomActions from "./bottomactions"
import DeviceToolbar from "../view/devicetoolbar/devicetoolbar"

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

type T = definition.UtilityProps

const Canvas: FunctionComponent<T> = (props) => {
	const [canvasSize, setCanvasSize] = useState<[number, number]>([0, 0])
	const [showDeviceToolbar, setShowDeviceToolbar] = useState(false)
	const canvasRef = useRef<HTMLDivElement>(null)
	const context = props.context
	const classes = styles.useUtilityStyles(
		{
			root: {
				padding: "38px 26px",
				maxWidth: "100%",
				maxHeight: "100%",
				height: "100%",
				overflow: "scroll",
			},

			container: {
				overflow: "scroll",
				maxWidth: "100%",
				width: canvasSize[0] ? canvasSize[0] + "px" : "100%",
				height: canvasSize[1] ? canvasSize[1] + "px" : "100%",
				position: "relative",
				margin: "0 auto",
				transition: "all 0.3s ease",
				maxHeight: "100%",
				borderRadius: "8px",
				boxShadow: "rgb(0 0 0 / 10%) 0px 0px 8px",
				background: "white",
			},

			outerwrapper: {
				width: canvasSize[0] ? canvasSize[0] + "px" : "100%",
				height: canvasSize[1] ? canvasSize[1] + "px" : "100%",
				transition: "all 0.3s ease",
				position: "relative",
			},

			contentwrapper: {
				overflow: "auto",
				height: "100%",
				position: "relative",
			},

			inner: {
				minHeight: "100%",
				padding: "0.05px", // Hack to prevent margin collapse
				position: "relative",
			},

			noContent: {
				display: "flex",
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

	if (!route || !viewDefId || !viewDef) return null

	const componentCount = viewDef.components?.length

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
		handleDrop(fullDragPath, fullDropPath, index, viewDef, uesio)
	}

	return (
		<div className={classes.root}>
			{showDeviceToolbar && (
				<DeviceToolbar
					context={props.context}
					onChange={(value) => setCanvasSize(value)}
					canvasRef={canvasRef.current}
				/>
			)}
			<div
				onDragLeave={onDragLeave}
				onDragOver={onDragOver}
				onDrop={onDrop}
				className={classes.container}
				ref={canvasRef}
			>
				<TopActions context={context} />
				<div className={classes.outerwrapper}>
					<div className={classes.contentwrapper}>
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
											Drag and drop any component here to
											get started
										</h4>
									</div>
								</div>
							)}
							{props.children}
							<PanelPortal context={context} />
						</div>
					</div>
					<component.PanelArea context={props.context} />
				</div>
			</div>
			<BottomActions
				context={context}
				toggleDeviceToolbar={() => {
					setCanvasSize([0, 0])
					setShowDeviceToolbar(!showDeviceToolbar)
				}}
			/>
		</div>
	)
}
Canvas.displayName = "Canvas"

export default Canvas
