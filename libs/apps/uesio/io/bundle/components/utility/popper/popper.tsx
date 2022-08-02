import { FunctionComponent, useState, useEffect } from "react"
import { definition, styles, component } from "@uesio/ui"
import { usePopper } from "react-popper"
import type { Placement } from "@popperjs/core"

interface TooltipProps extends definition.UtilityProps {
	placement?: Placement
	referenceEl: HTMLDivElement | null
	onOutsideClick?: () => void
}

const Popper: FunctionComponent<TooltipProps> = (props) => {
	const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null)
	const popper = usePopper(props.referenceEl, popperEl, {
		placement: props.placement,
		modifiers: [
			{ name: "offset", options: { offset: [0, 6] } },
			{ name: "preventOverflow", options: { padding: 6 } },
		],
	})

	useEffect(() => {
		const checkIfClickedOutside = (e: MouseEvent) => {
			// If the clicked target is outside the popper element
			if (popperEl && !popperEl.contains(e.target as Element)) {
				props.onOutsideClick && props.onOutsideClick()
			}
		}
		document.addEventListener("mousedown", checkIfClickedOutside)
		return () => {
			document.removeEventListener("mousedown", checkIfClickedOutside)
		}
	})

	const classes = styles.useUtilityStyles(
		{
			popper: {
				zIndex: 1,
				width: "350px",
			},
		},
		props
	)

	return (
		<component.Panel context={props.context}>
			<div
				className={classes.popper}
				ref={setPopperEl}
				style={popper.styles.popper}
				{...popper.attributes.popper}
			>
				{props.children}
			</div>
		</component.Panel>
	)
}

export default Popper
