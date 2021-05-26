import { FunctionComponent, useState } from "react"
import { definition, styles, hooks } from "@uesio/ui"
import { usePopper } from "react-popper"
import type { Placement } from "@popperjs/core"
import { createPortal } from "react-dom"

interface TooltipProps extends definition.UtilityProps {
	placement?: Placement
	referenceEl: HTMLDivElement | null
}

const Popper: FunctionComponent<TooltipProps> = (props) => {
	const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null)
	const popper = usePopper(props.referenceEl, popperEl, {
		placement: props.placement,
		modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
	})

	const portalNode = hooks.usePortal()

	const classes = styles.useUtilityStyles(
		{
			popper: {
				zIndex: 1,
				background: "white",
				margin: "4px",
				width: "350px",
				boxShadow: "0 0 4px #00000033",
			},
		},
		props
	)

	return createPortal(
		<div
			className={classes.popper}
			ref={setPopperEl}
			style={popper.styles.popper}
			{...popper.attributes.popper}
		>
			{props.children}
		</div>,
		portalNode
	)
}

export default Popper
