import { definition, styles } from "@uesio/ui"

const ReadOnlyField: definition.UtilityComponent = (props) => {
	const classes = styles.useUtilityStyles(
		{
			input: {},
			readonly: {},
		},
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
