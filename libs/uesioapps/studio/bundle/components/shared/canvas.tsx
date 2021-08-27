import { FunctionComponent, DragEvent, useRef, RefObject } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"
const Icon = component.registry.getUtility("io.icon")

let panelsDomNodeBuilder: RefObject<HTMLDivElement> | undefined = undefined
const Canvas: FunctionComponent<definition.UtilityProps> = (props) => {
	panelsDomNodeBuilder = useRef<HTMLDivElement>(null)

	const classes = styles.useUtilityStyles(
		{
			root: {
				overflowY: "scroll",
				padding: "60px",
				position: "relative",
				...styles.getBackgroundStyles(
					{
						image: "uesio.whitesplash",
					},
					props.context.getTheme(),
					props.context
				),
			},
			inner: {
				background: "white",
				minHeight: "100vh",
				padding: "0.05px", // Hack to prevent margin collapse
				position: "relative",
			},

			panelContainer: {
				position: "absolute",
				left: "0",
				top: "0",
				bottom: "0",
				right: "0",
				zIndex: 1,
				pointerEvents: "none",
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
					border: "3px dashed rgba(238, 238, 238)",
					padding: "0.5em 2em 2em 2em",
					borderRadius: "2em",
				},
			},
		},
		props
	)

	// Hide/show blank slate div
	const hasEmptyComponents =
		!props.context.getViewDef()?.definition?.components?.length

	const route = props.context.getRoute()
	if (!route) {
		return null
	}
	const uesio = hooks.useUesio(props)

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
		uesio.builder.clearDropNode()
	}

	return (
		<>
			<div
				onDragLeave={onDragLeave}
				onDragOver={onDragOver}
				className={classes.root}
			>
				<div
					className={classes.panelContainer}
					id="builderPanelsContainer"
				/>

				<div className={classes.inner}>
					<component.View
						context={props.context}
						path=""
						definition={{
							view: route.view,
							params: route.params,
						}}
					/>

					{/* No content yet */}
					{hasEmptyComponents && (
						<div className={classes.noContent}>
							<div className="inner">
								<Icon
									className="icon"
									icon={"flip_to_back"}
									context={props.context}
								/>
								<h3 className="text">
									Drag and drop any component here to get
									started
								</h3>
								<div className="quote">
									<h4>
										What's better than a blank slate in the
										right hands?
									</h4>
									<p>&mdash; Frank Underwood &mdash;</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
Canvas.displayName = "Canvas"

export default Canvas
