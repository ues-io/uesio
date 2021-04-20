import { FunctionComponent } from "react"
import { definition, styles, context, collection } from "@uesio/ui"

interface SelectFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	hideLabel?: boolean
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const useStyles = styles.getUseStyles(["root", "label", "input", "readonly"], {
	root: ({ width }) => ({
		...(width && { width }),
	}),
	label: () => ({}),
	input: () => ({
		appearance: "none",
	}),
	readonly: () => ({}),
})

const SelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const classes = useStyles(props)
	//const { setValue, value, mode } = props
	//const readonly = mode === "READ"
	return (
		<div className={classes.root}>
			<div className={classes.label}>{props.label}</div>
			<select className={classes.input}>
				{props.options?.map((option) => (
					<option
						value={option.value}
						selected={props.value === option.value}
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	)
}

export default SelectField
