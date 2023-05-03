import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface FieldLabelProps extends definition.UtilityProps {
	label?: string
}

const StyleDefaults = Object.freeze({
	root: [],
})

const FieldLabel: FunctionComponent<FieldLabelProps> = (props) => {
	const { label, context } = props
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.fieldlabel"
	)
	return <div className={classes.root}>{context.merge(label)}</div>
}

export default FieldLabel
