import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface TextProps extends definition.UtilityProps {
	text?: string
}

const useStyles = styles.getUseStyles(["root"])

const Link: FunctionComponent<TextProps> = (props) => {
	const classes = useStyles(props)
	const { text } = props
	return <span className={classes.root}>{text}</span>
}

export default Link
