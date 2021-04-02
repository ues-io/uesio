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
	const { context, title, subtitle, actions } = props
	return (
		<div className={classes.root}>
			<div className={classes.content}>
				<div className={classes.title}>{context.merge(title)}</div>
				{subtitle && (
					<div className={classes.subtitle}>
						{context.merge(subtitle)}
					</div>
				)}
			</div>
			<div className={classes.actions}>{actions}</div>
		</div>
	)
}

export default TitleBar
