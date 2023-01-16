import { FunctionComponent, useLayoutEffect } from "react"
import { definition, component, styles } from "@uesio/ui"
import {
	useFloating,
	autoUpdate,
	autoPlacement,
	Placement,
} from "@floating-ui/react"

interface TooltipProps extends definition.UtilityProps {
	placement?: Placement
	referenceEl: HTMLDivElement | null
	onOutsideClick?: () => void
	useFirstRelativeParent?: boolean
	offset?: [number, number]
}

const Popper: FunctionComponent<TooltipProps> = (props) => {
	const { x, y, strategy, refs } = useFloating({
		whileElementsMounted: autoUpdate,
		placement: props.placement,
		middleware: [autoPlacement({ allowedPlacements: ["top", "bottom"] })],
	})

	useLayoutEffect(() => {
		refs.setReference(props.referenceEl)
	}, [refs, props.referenceEl])

	const classes = styles.useUtilityStyles(
		{
			popper: {},
		},
		props
	)

	return (
		<component.Panel>
			<div
				ref={refs.setFloating}
				style={{
					position: strategy,
					top: y ?? 0,
					left: x ?? 0,
					width: "max-content",
				}}
				className={classes.popper}
			>
				{props.children}
			</div>
		</component.Panel>
	)
}

export default Popper
