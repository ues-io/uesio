import { useLayoutEffect, useRef } from "react"
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
	arrow,
	FloatingArrow,
	MiddlewareState,
} from "@floating-ui/react"

interface TooltipProps {
	placement?: Placement
	referenceEl: HTMLDivElement | null
	onOutsideClick?: () => void
	offset?: number
	autoPlacement?: Placement[]
	useFirstRelativeParent?: boolean
	matchHeight?: boolean
	arrow?: boolean
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
	arrow: [],
})

const Popper: definition.UtilityComponent<TooltipProps> = (props) => {
	const autoPlacements = props.autoPlacement || defaultPlacement

	const arrowRef = useRef(null)

	const { x, y, strategy, refs, middlewareData, context } = useFloating({
		whileElementsMounted: (...args) =>
			autoUpdate(...args, { animationFrame: true }),
		placement: props.placement,
		middleware: [
			offset(props.offset),
			autoPlacement({ allowedPlacements: autoPlacements }),
			hide(),
			...(props.matchHeight
				? [
						size({
							apply({ rects, elements }: MiddlewareState) {
								Object.assign(elements.floating.style, {
									height: `${rects.reference.height}px`,
								})
							},
						}),
				  ]
				: []),
			...(props.arrow
				? [
						arrow({
							element: arrowRef,
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
				{props.arrow && (
					<FloatingArrow
						width={12}
						height={6}
						className={classes.arrow}
						ref={arrowRef}
						context={context}
					/>
				)}
			</div>
		</FloatingPortal>
	)
}

export default Popper
