import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"
import {
	FloatingFocusManager,
	FloatingOverlay,
	useDismiss,
	useFloating,
	useInteractions,
} from "@floating-ui/react"

const minPagePadding = "40px"

interface DialogPlainUtilityProps extends definition.UtilityProps {
	onClose?: () => void
	width?: string
	height?: string
	initialFocus?: number
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
			},
			spacer: {
				gridRow: "3",
				gridColumn: "2 / 3",
			},
		},
		props
	)

	const floating = useFloating({
		open: true,
		onOpenChange: (open) => {
			if (!open && props.onClose) props.onClose()
		},
	})

	const dismiss = useDismiss(floating.context, {
		outsidePress: false,
		referencePress: true,
		bubbles: false,
	})

	const { getFloatingProps, getReferenceProps } = useInteractions([dismiss])

	return (
		<FloatingOverlay
			className={classes.blocker}
			lockScroll
			style={{ position: "absolute" }}
			ref={floating.refs.setReference}
			{...getReferenceProps()}
		>
			<FloatingFocusManager
				context={floating.context}
				initialFocus={props.initialFocus}
				closeOnFocusOut={false}
			>
				<div
					className={classes.root}
					ref={floating.refs.setFloating}
					{...getFloatingProps({
						onPointerDown(e) {
							e.stopPropagation()
						},
					})}
				>
					<div className={classes.inner}>{props.children}</div>
					<div className={classes.spacer} />
				</div>
			</FloatingFocusManager>
		</FloatingOverlay>
	)
}

export { DialogPlainUtilityProps }

export default DialogPlain
