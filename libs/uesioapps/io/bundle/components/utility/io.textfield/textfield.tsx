import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	type?: string
	hideLabel?: boolean
	mode?: context.FieldMode
}

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const { setValue, value, mode } = props
	const readonly = mode === "READ"
	const width = props.definition?.width as string
	const classes = styles.useStyles(
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
			<div className={classes.label}>{props.label}</div>
			<input
				value={value}
				className={styles.cx(
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
