import { ReactNode, FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ScrollPanelProps extends definition.UtilityProps {
	header?: ReactNode
	footer?: ReactNode
}

const ScrollPanel: FunctionComponent<ScrollPanelProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				borderRadius: "6px",
				boxShadow: "rgb(0 0 0 / 10%) 0px 0px 8px",
				background: "white",
				position: "relative",
			},
			inner: {
				overflowY: "auto",
				flex: 1,
			},
		},
		props
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
