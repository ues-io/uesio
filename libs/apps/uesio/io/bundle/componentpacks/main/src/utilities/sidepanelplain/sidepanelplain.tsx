import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"
import {
	FloatingFocusManager,
	FloatingOverlay,
	useDismiss,
	useFloating,
	useInteractions,
} from "@floating-ui/react"

interface SidePanelUtilityProps extends definition.UtilityProps {
	onClose?: () => void
	initialFocus?: number
}

const SidePanelPlain: FunctionComponent<SidePanelUtilityProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(
		{
			blocker: [],
			root: [],
			inner: [],
		},
		props,
		"uesio/io.sidepanel"
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
	console.log("plain classes:", classes)
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
				</div>
			</FloatingFocusManager>
		</FloatingOverlay>
	)
}

export default SidePanelPlain
