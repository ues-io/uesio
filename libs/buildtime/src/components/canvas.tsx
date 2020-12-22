import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import { makeStyles, createStyles } from "@material-ui/core"

const useStyles = makeStyles(() =>
	createStyles({
		content: {
			flexGrow: 1,
			position: "relative",
			padding: "40px 8px",
			minHeight: "100vh", // May need to adjust for LEX
		},
	})
)

const Canvas: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = useStyles()
	const route = props.context.getRoute()

	if (!route) {
		return null
	}

	const uesio = hooks.useUesio(props)

	// Handle the situation where a draggable leaves the canvas.
	// If the cursor is outside of the canvas's bounds, then clear
	// out the drop node.
	const onDragLeave = (e: React.DragEvent) => {
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
	const onDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		uesio.builder.setDropNode("")
	}

	return (
		<div
			onDragLeave={onDragLeave}
			onDragOver={onDragOver}
			className={classes.content}
		>
			<component.View
				{...props}
				definition={{
					view: `${route.viewnamespace}.${route.viewname}`,
					params: route.params,
				}}
			/>
		</div>
	)
}

export default Canvas
