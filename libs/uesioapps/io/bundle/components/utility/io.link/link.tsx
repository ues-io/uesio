import { FunctionComponent, MouseEvent } from "react"
import { definition, styles } from "@uesio/ui"

interface LinkProps extends definition.UtilityProps {
	onClick?: () => void
	text?: string
}

const useStyles = styles.getUseStyles(["root"])

const Link: FunctionComponent<LinkProps> = (props) => {
	const classes = useStyles(props)
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
