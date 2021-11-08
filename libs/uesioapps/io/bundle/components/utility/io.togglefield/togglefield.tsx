import { FC } from "react"
import {
	definition,
	styles,
	context,
	collection,
	component,
	wire,
	hooks,
} from "@uesio/ui"
import toggleStyles from "./togglestyles"

interface ToggleFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: boolean) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const ToggleField: FC<ToggleFieldProps> = (props) => {
	const { setValue, value, mode, hideLabel, context, label } = props
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
		<label title={`toggle ${label}`} className={classes.root}>
			<FieldLabel label={label} hide={hideLabel} context={context} />
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
