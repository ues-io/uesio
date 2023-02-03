import { FunctionComponent, useRef, useState } from "react"
import { definition, styles } from "@uesio/ui"
import {
	useFloating,
	useInteractions,
	arrow,
	offset,
	useHover,
	Placement,
	FloatingPortal,
} from "@floating-ui/react"

interface TooltipUtilityProps extends definition.UtilityProps {
	text: string
	placement?: Placement
	offset?: number
}

const Tooltip: FunctionComponent<TooltipUtilityProps> = (props) => {
	const arrowRef = useRef<HTMLDivElement>(null)
	const [open, setOpen] = useState<boolean>(false)
	const { x, y, strategy, refs, middlewareData, placement, context } =
		useFloating({
			open,
			onOpenChange: setOpen,
			placement: props.placement,
			middleware: [
				offset(props.offset || 0),
				arrow({
					element: arrowRef,
				}),
			],
		})

	const hover = useHover(context, {
		restMs: 400,
		// if their cursor never rests, open it after 1000 ms (fallback)
		delay: { open: 1000 },
	})
	const { getReferenceProps, getFloatingProps } = useInteractions([hover])

	const classes = styles.useUtilityStyles(
		{
			tooltip: {
				padding: "6px",
				background: "#222",
				color: "#f5f5f5",
				zIndex: 2,
				fontSize: "8pt",
			},
			arrow: {
				...(middlewareData?.arrow && {
					left:
						middlewareData.arrow.x !== null
							? `${middlewareData.arrow.x}px`
							: "",
					top:
						middlewareData.arrow.y !== null
							? `${middlewareData.arrow.y}px`
							: "",
				}),
				position: "absolute",
				width: "8px",
				height: "8px",
				background: "inherit",
				visibility: "hidden",
				"&:before": {
					position: "absolute",
					width: "8px",
					height: "8px",
					background: "inherit",
					visibility: "visible",
					content: "''",
					transform: "rotate(45deg)",
				},
				...(placement === "top" && {
					bottom: "-4px",
				}),
				...(placement === "bottom" && {
					top: "-4px",
				}),
				...(placement === "left" && {
					right: "-4px",
				}),
				...(placement === "right" && {
					left: "-4px",
				}),
			},
		},
		props
	)

	return (
		<>
			<div ref={refs.setReference} {...getReferenceProps()}>
				{props.children}
			</div>
			<FloatingPortal>
				{open && (
					<div
						{...getFloatingProps()}
						className={classes.tooltip}
						ref={refs.setFloating}
						style={{
							position: strategy,
							top: y ?? 0,
							left: x ?? 0,
							width: "max-content",
						}}
					>
						{props.text}
						<div ref={arrowRef} className={classes.arrow} />
					</div>
				)}
			</FloatingPortal>
		</>
	)
}
export { TooltipUtilityProps }
export default Tooltip
