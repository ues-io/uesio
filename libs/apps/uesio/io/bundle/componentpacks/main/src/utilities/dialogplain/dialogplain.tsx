import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"
import { FloatingOverlay } from "@floating-ui/react"

const minPagePadding = "40px"

interface DialogPlainUtilityProps extends definition.UtilityProps {
	onClose?: () => void
	width?: string
	height?: string
}

const DialogPlain: FunctionComponent<DialogPlainUtilityProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			blocker: {
				backdropFilter: "grayscale(50%) blur(5px) brightness(50%)",
			},
			root: {
				position: "absolute",
				top: 0,
				bottom: 0,
				height: "100%",
				width: "100%",
				display: "grid",
				gridTemplateColumns: `minmax(${minPagePadding},1fr) minmax(auto,${
					props.width || "auto"
				}) minmax(${minPagePadding},1fr)`,
				gridTemplateRows: `minmax(${minPagePadding},1fr) minmax(auto,${
					props.height || "auto"
				}) minmax(${minPagePadding},1fr)`,
				pointerEvents: "none",
			},
			inner: {
				boxShadow: "0 0 20px #0005",
				borderRadius: "4px",
				backgroundColor: "white",
				gridRow: "2 / 3",
				gridColumn: "2 / 3",
				pointerEvents: "auto",
				overflow: "scroll",
			},
		},
		props
	)

	return (
		<FloatingOverlay
			className={classes.blocker}
			lockScroll
			onClick={props.onClose}
		>
			<div className={classes.root} onClick={(e) => e.stopPropagation()}>
				<div className={classes.inner}>{props.children}</div>
			</div>
		</FloatingOverlay>
	)
}

export { DialogPlainUtilityProps }

export default DialogPlain
