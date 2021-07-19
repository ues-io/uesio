import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TitleBarProps extends definition.UtilityProps {
	title?: string
	subtitle?: string
	actions?: ReactNode
	onClick?: () => void
}

const TitleBar: FunctionComponent<TitleBarProps> = (props) => {
	const { context, title, subtitle, actions, onClick } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
			},
			content: {
				flex: 1,
				display: "flex",
				justifyContent: "center",
				flexDirection: "column",
			},
			title: {},
			subtitle: {},
			actions: {
				position: "relative",
			},
		},
		props
	)
	return (
		<div onClick={() => onClick && onClick()} className={classes.root}>
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
