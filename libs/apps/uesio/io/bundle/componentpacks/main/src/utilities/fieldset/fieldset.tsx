import { FC } from "react"
import { definition, styles } from "@uesio/ui"

interface Props extends definition.UtilityProps {
	fieldLabel: string
	disabled: boolean
}

const StyleDefaults = Object.freeze({
	fieldset: [],
	legend: ["hidden"],
})

const Fieldset: FC<Props> = (props) => {
	const { children, fieldLabel, disabled } = props

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	return (
		<fieldset className={classes.fieldset} disabled={disabled}>
			<legend className={classes.legend}>{fieldLabel}</legend>
			{children}
		</fieldset>
	)
}

export default Fieldset
