import { FunctionComponent, useState } from "react"
import { definition, styles } from "@uesio/ui"
import { usePopper } from "react-popper"
import type { Placement } from "@popperjs/core"

interface TooltipUtilityProps extends definition.UtilityProps {
	text: string
	placement?: Placement
}

const Tooltip: FunctionComponent<TooltipUtilityProps> = (props) => {
	const [referenceEl, setReferenceEl] = useState<HTMLDivElement | null>(null)
	const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null)
	const [arrowEl, setArrowEl] = useState<HTMLDivElement | null>(null)
	const [open, setOpen] = useState<boolean>(false)
	const popper = usePopper(referenceEl, popperEl, {
		placement: props.placement,
		modifiers: [
			{ name: "arrow", options: { element: arrowEl } },
			{ name: "offset", options: { offset: [0, 8] } },
		],
	})

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
				...(popper.state?.placement === "top" && {
					bottom: "-4px",
				}),
				...(popper.state?.placement === "bottom" && {
					top: "-4px",
				}),
				...(popper.state?.placement === "left" && {
					right: "-4px",
				}),
				...(popper.state?.placement === "right" && {
					left: "-4px",
				}),
			},
		},
		props
	)

	return (
		<>
			<div
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				ref={setReferenceEl}
			>
				{props.children}
			</div>
			{open && (
				<div
					className={classes.tooltip}
					ref={setPopperEl}
					style={popper.styles.popper}
					{...popper.attributes.popper}
				>
					{props.text}
					<div
						ref={setArrowEl}
						className={classes.arrow}
						style={popper.styles.arrow}
					/>
				</div>
			)}
		</>
	)
}
export { TooltipUtilityProps }
export default Tooltip
