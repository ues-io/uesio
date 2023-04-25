import { FunctionComponent, MouseEvent } from "react"
import { definition, styles } from "@uesio/ui"

interface LinkProps extends definition.UtilityProps {
	onClick?: () => void
	text?: string
}

const StyleDefaults = Object.freeze({ root: {} })

const Link: FunctionComponent<LinkProps> = (props) => {
	const classes = styles.useUtilityStyles(StyleDefaults, props)
	const { onClick, text } = props
	return (
		<a
			href=""
			onClick={(e: MouseEvent) => {
				e.preventDefault()
				onClick && onClick()
			}}
			className={classes.root}
		>
			{text}
		</a>
	)
}

export default Link
