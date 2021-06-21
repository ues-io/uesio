import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"
import TextField from "../io.textfield/textfield"
import useSelect from "../../hooks/useSelect"
interface SelectFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const SelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const { setValue, value, mode, hideLabel, options, label, context } = props
	const defaultOption = options && options[0] ? options[0].value : ""
	const [selectVal, setSelectVal] = useSelect(
		value || defaultOption,
		setValue
	)

	if (mode === "READ") {
		const optionMatch = options?.find((option) => option.value === value)
		const valueLabel = optionMatch?.label || ""
		return <TextField {...props} value={valueLabel} />
	}
	const width = props.definition?.width as string
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(width && { width }),
				position: "relative",
				"&:after": {
					content: '"expand_more"',
					fontFamily: "Material Icons",
					position: "absolute",
					right: "10px",
					bottom: "20px",
					pointerEvents: "none",
				},
			},
			input: {
				appearance: "none",
			},
		},
		props
	)

	return (
		<div className={classes.root}>
			<FieldLabel label={label} hide={hideLabel} context={context} />
			<select
				className={classes.input}
				onChange={(e) => setSelectVal(e.target.value)}
			>
				{options?.map((option) => (
					<option
						value={option.value}
						selected={option.value === selectVal}
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	)
}

export default SelectField
