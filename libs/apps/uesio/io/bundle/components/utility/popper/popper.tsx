import { FunctionComponent, useState, useEffect } from "react"
import { definition, styles, component } from "@uesio/ui"
import { usePopper } from "react-popper"
import type { Placement } from "@popperjs/core"

interface TooltipProps extends definition.UtilityProps {
	placement?: Placement
	referenceEl: HTMLDivElement | null
	onOutsideClick?: () => void
	useFirstRelativeParent?: boolean
	offset?: [number, number]
}

const getRelativeParent = (elem: Element | null): Element | null => {
	if (!elem) return null
	const parent = elem.parentElement
	if (!parent) return elem
	const style = window.getComputedStyle(parent)
	if (style.getPropertyValue("position") === "relative") return parent
	return getRelativeParent(parent)
}

const Popper: FunctionComponent<TooltipProps> = (props) => {
	const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null)
	const referenceEl = props.useFirstRelativeParent
		? getRelativeParent(props.referenceEl)
		: props.referenceEl
	const popper = usePopper(referenceEl, popperEl, {
		placement: props.placement,
		modifiers: [
			{ name: "offset", options: { offset: props.offset ?? [0, 6] } },
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
