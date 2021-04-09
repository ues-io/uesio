import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"
import { field } from "@uesio/constants"

interface TextFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	type?: string
	hideLabel?: boolean
	mode?: field.FieldMode
}

const useStyles = styles.getUseStyles(["root", "label", "input", "readonly"], {
	root: ({ width }) => ({
		...(width && { width }),
	}),
	label: () => ({}),
	input: () => ({}),
	readonly: () => ({}),
})

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const classes = useStyles(props)
	const { setValue, value, mode } = props
	const readonly = mode === "READ"
	return (
		<div className={classes.root}>
			<div className={classes.label}>{props.label}</div>
			<input
				value={value}
				className={styles.clsx(
					classes.input,
					readonly && classes.readonly
				)}
				type="text"
				disabled={readonly}
				onChange={(event: ChangeEvent<HTMLInputElement>): void =>
					setValue(event.target.value)
				}
			/>
		</div>
	)
}

export default TextField
