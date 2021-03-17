import { FunctionComponent } from "react"
import { TextField } from "@material-ui/core"
import {
	PropRendererProps,
	inputStyles,
	inputProps,
	inputLabelProps,
} from "./proprendererdefinition"
import { builder } from "@uesio/ui"

interface SelectPropRendererProps extends PropRendererProps {
	descriptor: builder.SelectProp
}

const SelectProp: FunctionComponent<SelectPropRendererProps> = ({
	descriptor,
	setValue,
	getValue,
}) => (
	<TextField
		select={true}
		SelectProps={{ native: true }}
		variant="outlined"
		InputProps={inputProps}
		InputLabelProps={inputLabelProps}
		style={inputStyles}
		size="small"
		value={getValue()}
		label={descriptor.label}
		fullWidth={true}
		onChange={(event): void => setValue(event.target.value)}
	>
		<option value="" />
		{descriptor.options.map((option) => (
			<option key={option.value} value={option.value}>
				{option.label}
			</option>
		))}
	</TextField>
)

export default SelectProp
