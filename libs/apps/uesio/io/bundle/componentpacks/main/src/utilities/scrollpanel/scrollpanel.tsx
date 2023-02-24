import { ReactNode, FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ScrollPanelProps extends definition.UtilityProps {
	header?: ReactNode
	footer?: ReactNode
}

const ScrollPanel: FunctionComponent<ScrollPanelProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {},
			inner: {},
		},
		props,
		"uesio/io.scrollpanel"
	)
	return (
		<div className={classes.root}>
			{props.header}
			<div className={classes.inner}>{props.children}</div>
			{props.footer}
		</div>
	)
}

ScrollPanel.displayName = "ScrollPanel"

export default ScrollPanel
