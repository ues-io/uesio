import { ReactNode, forwardRef } from "react"
import { definition, styles } from "@uesio/ui"

interface ScrollPanelProps extends definition.UtilityProps {
	header?: ReactNode
	footer?: ReactNode
}

const StyleDefaults = Object.freeze({
	root: [],
	inner: [],
})

const ScrollPanel = forwardRef<HTMLDivElement, ScrollPanelProps>(
	(props, ref) => {
		const classes = styles.useUtilityStyleTokens(
			StyleDefaults,
			props,
			"uesio/io.scrollpanel"
		)
		return (
			<div id={props.id} ref={ref} className={classes.root}>
				{props.header}
				<div className={classes.inner}>{props.children}</div>
				{props.footer}
			</div>
		)
	}
)

ScrollPanel.displayName = "ScrollPanel"

export default ScrollPanel
