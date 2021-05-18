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
				height: "100%",
				overflow: "hidden",
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

export default ScrollPanel
