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
	closeOnOutsideClick?: boolean
	closed?: boolean
}

const StyleDefaults = Object.freeze({
	blocker: [],
	root: [],
	inner: [],
	blockerClosed: [],
	rootClosed: [],
	innerClosed: [],
})

const SidePanelPlain: definition.UtilityComponent<SidePanelUtilityProps> = (
	props
) => {
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.sidepanel"
	)

	const floating = useFloating({
		open: true,
		onOpenChange: (open) => {
			if (!open && props.onClose) props.onClose()
		},
	})

	const closeOnOutsideClick =
		props.closeOnOutsideClick === undefined
			? true
			: !!props.closeOnOutsideClick

	const dismiss = useDismiss(floating.context, {
		outsidePress: false,
		referencePress: closeOnOutsideClick,
	})

	const { getFloatingProps, getReferenceProps } = useInteractions([dismiss])

	return (
		<FloatingOverlay
			className={styles.cx(
				classes.blocker,
				props.closed && classes.blockerClosed
			)}
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
					className={styles.cx(
						classes.root,
						props.closed && classes.rootClosed
					)}
					ref={floating.refs.setFloating}
					{...getFloatingProps({
						onPointerDown(e) {
							e.stopPropagation()
						},
					})}
				>
					<div
						className={styles.cx(
							classes.inner,
							props.closed && classes.innerClosed
						)}
					>
						{props.children}
					</div>
				</div>
			</FloatingFocusManager>
		</FloatingOverlay>
	)
}

export default SidePanelPlain
