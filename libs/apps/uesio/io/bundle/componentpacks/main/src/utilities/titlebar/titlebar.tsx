import { ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TitleBarUtilityProps {
	title?: string
	subtitle?: string
	subtitlenode?: ReactNode
	actions?: ReactNode
	avatar?: ReactNode
	onClick?: () => void
}

const StyleDefaults = Object.freeze({
	root: [],
	content: [],
	title: [],
	subtitle: [],
	actions: [],
	avatar: ["empty:hidden"],
})

const TitleBar: definition.UtilityComponent<TitleBarUtilityProps> = (props) => {
	const {
		context,
		title,
		subtitle,
		subtitlenode,
		actions,
		onClick,
		id,
		avatar,
	} = props
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.titlebar"
	)

	return (
		<div
			id={id}
			role={onClick ? "button" : undefined}
			onClick={() => onClick && onClick()}
			className={classes.root}
		>
			{avatar ? (
				<div className={classes.avatar}>{avatar}</div>
			) : undefined}
			<div className={classes.content}>
				<p className={classes.title}>{context.mergeString(title)}</p>

				{/* Render whitespace if subtitle is empty string */}
				{(subtitle || subtitle === "") && (
					<p className={classes.subtitle}>
						{subtitle === "" ? (
							<>&nbsp;</>
						) : (
							context.mergeString(subtitle)
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
