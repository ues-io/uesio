import { FunctionComponent, useLayoutEffect } from "react"
import { definition, styles } from "@uesio/ui"
import {
	useFloating,
	autoUpdate,
	hide,
	autoPlacement,
	Placement,
	offset,
	size,
	FloatingPortal,
} from "@floating-ui/react"

interface TooltipProps extends definition.UtilityProps {
	placement?: Placement
	referenceEl: HTMLDivElement | null
	onOutsideClick?: () => void
	offset?: number
	autoPlacement?: Placement[]
	useFirstRelativeParent?: boolean
	matchHeight?: boolean
}

const defaultPlacement: Placement[] = ["top", "bottom"]

const getRelativeParent = (elem: Element | null): Element | null => {
	if (!elem) return null
	const parent = elem.parentElement
	if (!parent) return elem
	const style = window.getComputedStyle(parent)
	if (style.getPropertyValue("position") === "relative") return parent
	return getRelativeParent(parent)
}

const StyleDefaults = Object.freeze({
	popper: [],
})

const Popper: FunctionComponent<TooltipProps> = (props) => {
	const autoPlacements = props.autoPlacement || defaultPlacement

	const { x, y, strategy, refs, middlewareData } = useFloating({
		whileElementsMounted: autoUpdate,
		placement: props.placement,
		middleware: [
			offset(props.offset),
			autoPlacement({ allowedPlacements: autoPlacements }),
			hide(),
			...(props.matchHeight
				? [
						size({
							apply({ rects, elements }) {
								Object.assign(elements.floating.style, {
									height: `${rects.reference.height}px`,
								})
							},
						}),
				  ]
				: []),
		],
	})

	useLayoutEffect(() => {
		const referenceEl = props.useFirstRelativeParent
			? getRelativeParent(props.referenceEl)
			: props.referenceEl
		refs.setReference(referenceEl)
	}, [refs, props.referenceEl, props.useFirstRelativeParent])

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	return (
		<FloatingPortal>
			<div
				ref={refs.setFloating}
				style={{
					position: strategy,
					top: y ?? 0,
					left: x ?? 0,
					width: "max-content",
					visibility: middlewareData.hide?.referenceHidden
						? "hidden"
						: "visible",
				}}
				className={classes.popper}
			>
				{props.children}
			</div>
		</FloatingPortal>
	)
}

export default Popper
