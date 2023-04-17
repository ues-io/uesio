import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TitleBarUtilityProps extends definition.UtilityProps {
	title?: string
	subtitle?: string
	subtitlenode?: ReactNode
	actions?: ReactNode
	onClick?: () => void
}

const TitleBar: FunctionComponent<TitleBarUtilityProps> = (props) => {
	const { context, title, subtitle, subtitlenode, actions, onClick } = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
			content: {},
			title: {},
			subtitle: {},
			actions: {},
		},
		props,
		"uesio/io.titlebar"
	)

	return (
		<div
			role={onClick ? "button" : undefined}
			onClick={() => onClick && onClick()}
			className={classes.root}
		>
			<div className={classes.content}>
				<p className={classes.title}>{context.merge(title)}</p>

				{/* Render whitespace if subtitle is empty string */}
				{(subtitle || subtitle === "") && (
					<p className={classes.subtitle}>
						{subtitle === "" ? (
							<>&nbsp;</>
						) : (
							context.merge(subtitle)
						)}
					</p>
				)}
				{subtitlenode}
			</div>
			<div className={classes.actions}>{actions}</div>
		</div>
	)
}

export default TitleBar
