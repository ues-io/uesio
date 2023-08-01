import { definition, styles } from "@uesio/ui"
import {
	FloatingFocusManager,
	FloatingOverlay,
	useDismiss,
	useFloating,
	useInteractions,
} from "@floating-ui/react"

interface SidePanelUtilityProps {
	onClose?: () => void
	initialFocus?: number
}

const SidePanelPlain: definition.UtilityComponent<SidePanelUtilityProps> = (
	props
) => {
	const classes = styles.useUtilityStyleTokens(
		{
			blocker: [
				"backdrop-blur-sm",
				"backdrop-grayscale-[50%]",
				"backdrop-brightness-50",
			],
			root: ["absolute", "inset-0", "pointer-events-none"],
			inner: [
				"shadow-md",
				"inset-y-0",
				"right-0",
				"pointer-events-auto",
				"bg-white",
				"w-10/12",
				"max-w-xs",
				"absolute",
			],
		},
		props,
		"uesio/io.dialogplain"
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
				</div>
			</FloatingFocusManager>
		</FloatingOverlay>
	)
}

export default SidePanelPlain
