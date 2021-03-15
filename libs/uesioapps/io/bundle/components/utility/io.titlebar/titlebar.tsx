import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TitleBarProps extends definition.BaseProps {
	title?: string
	subtitle?: string
	actions?: ReactNode
}

const useStyles = styles.getUseStyles(
	["root", "content", "title", "subtitle", "actions"],
	{
		root: () => ({
			display: "flex",
		}),
		content: () => ({
			flex: 1,
		}),
		title: () => ({}),
		subtitle: () => ({}),
		actions: () => ({}),
	}
)

const TitleBar: FunctionComponent<TitleBarProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			<div className={classes.content}>
				<div className={classes.title}>{props.title}</div>
				{props.subtitle && (
					<div className={classes.subtitle}>{props.subtitle}</div>
				)}
			</div>
			<div className={classes.actions}>{props.actions}</div>
		</div>
	)
}

export default TitleBar
