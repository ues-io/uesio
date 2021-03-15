import { FunctionComponent } from "react"
import { DatePickerProps } from "./datePickerdefinition"
import { styles } from "@uesio/ui"
import { TextField } from "@material-ui/core"

const useStyles = styles.getUseStyles(["container"], {
	container: {
		padding: "10px",
	},
})

const DatePicker: FunctionComponent<DatePickerProps> = (props) => (
	<div className={useStyles(props).container}>
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

export default DatePicker
