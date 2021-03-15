import { ReactNode, CSSProperties, FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ScrollPanelProps extends definition.BaseProps {
	header?: ReactNode
	footer?: ReactNode
	style?: CSSProperties
}

const useStyles = styles.getUseStyles(["root", "inner"], {
	root: () => ({
		display: "flex",
		flexDirection: "column",
		height: "100%",
		overflow: "hidden",
	}),
	inner: () => ({
		overflowY: "auto",
		flex: 1,
	}),
})

const ScrollPanel: FunctionComponent<ScrollPanelProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div style={props.style} className={classes.root}>
			{props.header}
			<div className={classes.inner}>{props.children}</div>
			{props.footer}
		</div>
	)
}

export default ScrollPanel
