import { FC } from "react"
import { definition, styles, context, collection, wire, hooks } from "@uesio/ui"
import toggleStyles from "./togglestyles"

interface ToggleFieldProps extends definition.UtilityProps {
	setValue: (value: boolean) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const ToggleField: FC<ToggleFieldProps> = (props) => {
	const { setValue, value, mode } = props
	const uesio = hooks.useUesio(props)

	const {
		definition: {
			palette: { primary: primaryColor },
		},
	} = uesio.getTheme()

	const readonly = mode === "READ"
	const checked = value === true
	const classes = styles.useUtilityStyles(
		{
			root: {
				...toggleStyles(primaryColor, mode),
			},
			native: {},
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<label title={`toggle`} className={classes.root}>
			<div className="switch">
				<input
					className={classes.native}
					checked={checked}
					type="checkbox"
					disabled={readonly}
					onChange={(event): void => setValue(event.target.checked)}
				/>
				<span className="slider round" />
			</div>
		</label>
	)
}

export default ToggleField
