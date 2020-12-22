import { FunctionComponent } from "react";
import { DatePickerProps } from "./datePickerdefinition"
import { material } from "@uesio/ui"

const useStyles = material.makeStyles(() => ({
	container: {
		padding: "10px",
	},
}))

const DatePicker: FunctionComponent<DatePickerProps> = ({
	definition: { color, label, variant },
}) => (
	<div className={useStyles().container}>
		<material.TextField
			color={color}
			label={label}
			type="date"
			InputLabelProps={{
				shrink: true,
			}}
			variant={variant}
		/>
	</div>
)

export default DatePicker
