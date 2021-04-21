import { ReactNode, CSSProperties, FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ScrollPanelProps extends definition.BaseProps {
	header?: ReactNode
	footer?: ReactNode
	style?: CSSProperties
}

const ScrollPanel: FunctionComponent<ScrollPanelProps> = (props) => {
	const classes = styles.useStyles(
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
		<div style={props.style} className={classes.root}>
			{props.header}
			<div className={classes.inner}>{props.children}</div>
			{props.footer}
		</div>
	)
}

export default ScrollPanel
