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
}

const DialogPlain: definition.UtilityComponent<DialogPlainUtilityProps> = (
	props
) => {
	const classes = styles.useUtilityStyleTokens(
		{
			blocker: [
				"absolute",
				"backdrop-blur-sm",
				"backdrop-grayscale-[50%]",
				"backdrop-brightness-50",
				"flex",
			],
			wrapper: [
				"inset-0",
				"m-auto",
				"grid",
				"pointer-events-none",
				...(props.width ? [`w-[${props.width}]`] : []),
				...(props.height ? [`h-[${props.height}]`] : []),
			],
			inner: [
				"shadow-md",
				"overflow-hidden",
				"m-2",
				"rounded",
				"pointer-events-auto",
				"bg-white",
				"[container-type:size]",
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
			ref={floating.refs.setReference}
			{...getReferenceProps()}
		>
			<FloatingFocusManager
				context={floating.context}
				initialFocus={props.initialFocus}
				closeOnFocusOut={false}
			>
				<div
					className={classes.wrapper}
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
