import { definition, styles } from "@uesio/ui"

interface FieldLabelProps {
	label?: string
}

const StyleDefaults = Object.freeze({
	root: [],
})

const FieldLabel: definition.UtilityComponent<FieldLabelProps> = (props) => {
	const { label, context } = props
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.fieldlabel"
	)
	return <div className={classes.root}>{context.merge(label)}</div>
}

export default FieldLabel
