import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"

interface UserFieldProps extends definition.UtilityProps {
	label?: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	hideLabel: boolean
	record: wire.WireRecord
	wire: wire.Wire
}

const TextField: FunctionComponent<UserFieldProps> = (props) => {
	const { setValue, value, mode, hideLabel, record, fieldMetadata } = props
	const readonly = mode === "READ"
	const fieldId = fieldMetadata.getId()
	const user = record.getFieldReference(fieldId)
	const width = props.definition?.width as string
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(width && { width }),
			},
			label: {},
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<div className={classes.root}>
			{!hideLabel && <div className={classes.label}>{props.label}</div>}
			<div>
				{user && `${user["uesio.firstname"]} ${user["uesio.lastname"]}`}
			</div>
		</div>
	)
}

export default TextField
