import { FunctionComponent, DragEvent } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"

const Canvas: FunctionComponent<definition.UtilityProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				overflowY: "scroll",
				padding: "60px",
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
			},
		},
		props
	)
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
			uesio.builder.setDropNode("")
		} else {
			const currentTarget = e.currentTarget as HTMLDivElement
			const bounds = currentTarget.getBoundingClientRect()
			const outsideLeft = e.pageX < bounds.left
			const outsideRight = e.pageX > bounds.right
			const outsideTop = e.pageY < bounds.top
			const outsideBottom = e.pageY > bounds.bottom
			if (outsideLeft || outsideRight || outsideTop || outsideBottom) {
				uesio.builder.setDropNode("")
			}
		}
	}

	// Handle the situation where no other slots are accepting draggable
	// items. This clears out the current drop node so that our slot
	// acceptance indicators go away.
	const onDragOver = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		uesio.builder.setDropNode("")
	}

	return (
		<div
			onDragLeave={onDragLeave}
			onDragOver={onDragOver}
			className={classes.root}
		>
			<div className={classes.inner}>
				<component.View
					{...props}
					definition={{
						view: route.view,
						params: route.params,
					}}
				/>
			</div>
		</div>
	)
}

export default Canvas
