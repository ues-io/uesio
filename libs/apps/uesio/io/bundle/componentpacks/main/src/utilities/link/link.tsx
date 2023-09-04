import { MouseEvent } from "react"
import { definition, styles } from "@uesio/ui"

interface LinkProps {
	onClick?: () => void
	text?: string
}

const StyleDefaults = Object.freeze({ root: [] })

const Link: definition.UtilityComponent<LinkProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
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
