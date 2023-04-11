import { FC } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import Fieldset from "../fieldset/fieldset"

interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value?: wire.FieldValue
	width?: string
	fieldMetadata: collection.Field
	fieldId: string
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
	readonly?: boolean
}

const RadioButtons: FC<SelectFieldProps> = (props) => {
	const {
		setValue,
		value = {},
		mode,
		options,
		context,
		fieldMetadata,
		fieldId,
		readonly,
	} = props

	const classes = styles.useUtilityStyles(
		{
			input: {
				appearance: "none",
			},
			option: {
				padding: "8px",
				display: "flex",
				alignItems: "center",
				gap: "8px",
			},
			label: {
				userSelect: "none",
			},
		},
		props
	)

	const fieldLabel = fieldMetadata.getLabel()
	return (
		<Fieldset
			fieldLabel={fieldLabel}
			context={context}
			disabled={readonly || mode === "READ"}
		>
			{options
				?.filter(({ value }) => value)
				.map((option) => {
					const optionId = `${fieldId}_radio_${option.value}`.replace(
						/ /g,
						"_"
					)
					return (
						<div className={classes.option} key={option.value}>
							<input
								id={optionId}
								value={option.value}
								type={"radio"}
								checked={option.value === value}
								name={fieldMetadata.getId()}
								onChange={(e) => setValue(e.target.value)}
							/>
							<label className={classes.label} htmlFor={optionId}>
								{option.label}
							</label>
						</div>
					)
				})}
		</Fieldset>
	)
}

export default RadioButtons
