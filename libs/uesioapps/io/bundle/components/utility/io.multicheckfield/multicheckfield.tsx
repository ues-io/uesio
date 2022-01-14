import { FC } from "react"
import {
	definition,
	styles,
	context,
	collection,
	wire,
	component,
} from "@uesio/ui"

interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value?: Record<string, boolean>
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const CheckBoxField = component.registry.getUtility("io.checkboxfield")

const MultiCheckField: FC<SelectFieldProps> = (props) => {
	const {
		setValue,
		value = {},
		mode,
		options,
		context,
		fieldMetadata,
	} = props

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

	const fieldLabel = fieldMetadata.getLabel()
	const fieldId = fieldMetadata.getLabel()
	return (
		<fieldset>
			<legend>{fieldLabel}</legend>
			{options
				?.filter((el) => el.value)
				.map((option) => {
					const optionId = `${fieldId}_check_${option.value}`
						.replace(/ /g, "_")
						.toLowerCase()
					return (
						<div className={classes.option} key={option.value}>
							<CheckBoxField
								id={optionId}
								value={value[option.value]}
								context={context}
								setValue={(optionVal: boolean) => {
									if (mode === "READ") return
									// Set the false value, then filter out the false values before setting
									return setValue(
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
								}}
							/>
							<label className={classes.label} htmlFor={optionId}>
								{option.label}
							</label>
						</div>
					)
				})}
		</fieldset>
	)
}

export default MultiCheckField
