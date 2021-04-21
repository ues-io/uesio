import { FunctionComponent } from "react"
import { DatePickerProps } from "./datePickerdefinition"
import { styles } from "@uesio/ui"
import { TextField } from "@material-ui/core"

const DatePicker: FunctionComponent<DatePickerProps> = (props) => {
	const classes = styles.useStyles(
		{
			container: {
				padding: "10px",
			},
		},
		props
	)
	return (
		<div className={classes.container}>
			<TextField
				color={props.definition.color}
				label={props.definition.label}
				type="date"
				InputLabelProps={{
					shrink: true,
				}}
				variant={props.definition.variant}
			/>
		</div>
	)
}

export default DatePicker
