import { definition, styles, context, collection, wire } from "@uesio/ui"
import Fieldset from "../fieldset/fieldset"
import CheckboxField from "./checkbox"

interface SelectFieldProps {
	setValue: (value: wire.FieldValue) => void
	value?: wire.FieldValue
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const MultiCheckField: definition.UtilityComponent<SelectFieldProps> = (
	props
) => {
	const { id, setValue, mode, options, context, fieldMetadata } = props

	const classes = styles.useUtilityStyles(
		{
			input: {
				appearance: "none",
			},
			option: {
				display: "flex",
				alignItems: "center",
			},
			label: {
				userSelect: "none",
			},
		},
		props
	)

	// TODO: Better checking here
	const value = props.value as Record<string, boolean>

	const fieldLabel = fieldMetadata.getLabel()

	return (
		<Fieldset
			id={id}
			context={context}
			fieldLabel={fieldLabel}
			disabled={mode === "READ"}
		>
			{options
				?.filter(({ value }) => value)
				.map((option) => {
					const optionId =
						`${fieldLabel}_check_${option.value}`.replace(/ /g, "_")
					return (
						<div className={classes.option} key={option.value}>
							<CheckboxField
								value={value && value[option.value]}
								context={context}
								setValue={(optionVal: boolean) =>
									// Set the false/true value, then filter out the false values before setting
									setValue(
										Object.entries({
											...value,
											[option.value]: optionVal,
										}).reduce(
											(prev, [key, val]) =>
												val
													? { ...prev, [key]: true }
													: null,
											{}
										)
									)
								}
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

export default MultiCheckField
