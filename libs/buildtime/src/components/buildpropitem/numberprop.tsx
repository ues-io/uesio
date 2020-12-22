import { FunctionComponent } from "react";
import { TextField } from "@material-ui/core"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"

const NumberProp: FunctionComponent<PropRendererProps> = ({
	descriptor,
	setValue,
	getValue,
}) => (
	<TextField
		value={getValue()}
		label={descriptor.label}
		size="small"
		type="number"
		fullWidth={true}
		style={inputStyles}
		InputProps={inputProps}
		InputLabelProps={inputLabelProps}
		variant="outlined"
		onChange={(event): void => setValue(parseInt(event.target.value, 10))}
	/>
)

export default NumberProp
