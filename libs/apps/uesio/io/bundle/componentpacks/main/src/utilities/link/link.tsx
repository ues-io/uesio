import { MouseEvent } from "react"
import { definition, styles } from "@uesio/ui"

interface LinkProps {
	onClick?: () => void
	text?: string
	link?: string
	newTab?: boolean
}

const StyleDefaults = Object.freeze({ root: [] })

const Link: definition.UtilityComponent<LinkProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	const { onClick, text, link, newTab, context } = props
	return (
		<a
			href={context.mergeString(link)}
			onClick={(e: MouseEvent) => {
				if (link) return
				e.preventDefault()
				onClick && onClick()
			}}
			target={newTab ? "_blank" : undefined}
			className={classes.root}
		>
			{text}
		</a>
	)
}

export default Link
