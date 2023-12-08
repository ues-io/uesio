import { definition, styles } from "@uesio/ui"

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const ReadOnlyField: definition.UtilityComponent = (props) => {
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)
	return (
		<div className={styles.cx(classes.input, classes.readonly)}>
			{props.children || <>&nbsp;</>}
		</div>
	)
}

export default ReadOnlyField
