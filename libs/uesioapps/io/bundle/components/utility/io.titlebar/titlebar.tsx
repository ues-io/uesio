import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TitleBarUtilityProps extends definition.UtilityProps {
	title?: string
	subtitle?: string
	actions?: ReactNode
	onClick?: () => void
}

const TitleBar: FunctionComponent<TitleBarUtilityProps> = (props) => {
	const { context, title, subtitle, actions, onClick } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				columnGap: "20px",
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
				{/* Render whitespace if subtitle is empty string */}
				{subtitle ||
					(subtitle === "" && (
						<div className={classes.subtitle}>
							{subtitle === "" ? (
								<>&nbsp;</>
							) : (
								context.merge(subtitle)
							)}
						</div>
					))}
			</div>
			<div className={classes.actions}>{actions}</div>
		</div>
	)
}

export { TitleBarUtilityProps }

export default TitleBar
