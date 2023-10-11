import { definition, styles } from "@uesio/ui"
import {
	FloatingFocusManager,
	FloatingOverlay,
	useDismiss,
	useFloating,
	useInteractions,
} from "@floating-ui/react"

const minPagePadding = "40px"

interface DialogPlainUtilityProps {
	onClose?: () => void
	width?: string
	height?: string
	initialFocus?: number
}

const DialogPlain: definition.UtilityComponent<DialogPlainUtilityProps> = (
	props
) => {
	const gridCols = `grid-cols-[minmax(${minPagePadding},1fr)_minmax(auto,${
		props.width || "auto"
	})_minmax(${minPagePadding},1fr)]`

	const gridRows = `grid-rows-[minmax(${minPagePadding},1fr)_minmax(auto,${
		props.height || "auto"
	})_minmax(${minPagePadding},1fr)]`

	const classes = styles.useUtilityStyleTokens(
		{
			blocker: [
				"backdrop-blur-sm",
				"backdrop-grayscale-[50%]",
				"backdrop-brightness-50",
			],
			root: [
				"absolute",
				"inset-0",
				"grid",
				gridCols,
				gridRows,
				"pointer-events-none",
			],
			inner: [
				"shadow-md",
				"rounded",
				"row-start-2",
				"row-end-2",
				"col-start-2",
				"pointer-events-auto",
				"bg-white",
				"[container-type:inline-size]",
			],
			spacer: ["row-start-3", "col-start-2", "col-end-3"],
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
					<div className={classes.spacer} />
				</div>
			</FloatingFocusManager>
		</FloatingOverlay>
	)
}

export default DialogPlain
