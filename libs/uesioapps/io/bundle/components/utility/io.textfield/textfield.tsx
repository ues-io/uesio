import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	width?: string
}

const useStyles = styles.getUseStyles(["root", "label", "input"], {
	root: ({ width }) => ({
		...(width && { width }),
	}),
	label: () => ({}),
	input: () => ({}),
})

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const classes = useStyles(props)
	const { setValue } = props
	return (
		<div className={classes.root}>
			<div className={classes.label}>{props.label}</div>
			<input
				className={classes.input}
				type="text"
				onChange={(event: ChangeEvent<HTMLInputElement>): void =>
					setValue(event.target.value)
				}
			/>
		</div>
	)
}

export default TextField
