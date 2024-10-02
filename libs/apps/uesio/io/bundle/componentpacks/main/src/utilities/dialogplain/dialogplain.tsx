import { definition, styles } from "@uesio/ui"
import {
	FloatingFocusManager,
	FloatingOverlay,
	useDismiss,
	useFloating,
	useInteractions,
} from "@floating-ui/react"

interface DialogPlainUtilityProps {
	onClose?: () => void
	width?: string
	height?: string
	initialFocus?: number
	closeOnOutsideClick?: boolean
	closed?: boolean
}

const DialogPlain: definition.UtilityComponent<DialogPlainUtilityProps> = (
	props
) => {
	const classes = styles.useUtilityStyleTokens(
		{
			blocker: [],
			wrapper: [
				...(props.width ? [`w-[${props.width}]`] : ["w-1/2"]),
				...(props.height ? [`h-[${props.height}]`] : ["h-1/2"]),
			],
			inner: [],
			blockerClosed: [],
			wrapperClosed: [],
		},
		props,
		"uesio/io.dialog"
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
						classes.wrapper,
						props.closed && classes.wrapperClosed
					)}
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

export default DialogPlain
