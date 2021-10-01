import { FunctionComponent, useState, useEffect, MouseEvent } from "react"
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
		modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
	})

	useEffect(() => {
		const checkIfClickedOutside = (e: globalThis.MouseEvent) => {
			// If the clicked target is outside the popper element
			if (popperEl && !popperEl.contains(e.target as Element)) {
				console.log("outside")
				props.onOutsideClick && props.onOutsideClick()
			}
		}

		document.addEventListener("mousedown", (e) => checkIfClickedOutside(e))

		return () => {
			document.removeEventListener("mousedown", (e) =>
				checkIfClickedOutside(e)
			)
		}
	})

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
