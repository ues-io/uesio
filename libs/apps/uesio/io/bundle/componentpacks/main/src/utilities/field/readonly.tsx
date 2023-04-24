import { definition, styles } from "@uesio/ui"

const StyleDefaults = Object.freeze({
	input: {},
	readonly: {},
})

const ReadOnlyField: definition.UtilityComponent = (props) => {
	const classes = styles.useUtilityStyles(
		StyleDefaults,
		props,
		"uesio/io.field"
	)
	return (
		<div className={styles.cx(classes.input, classes.readonly)}>
			{props.children}
		</div>
	)
}

export default ReadOnlyField
