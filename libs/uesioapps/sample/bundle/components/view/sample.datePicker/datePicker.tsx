import { FunctionComponent } from "react"
import { DatePickerProps } from "./datePickerdefinition"
import { styles } from "@uesio/ui"

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
			<input type="date" />
		</div>
	)
}

export default DatePicker
