import { definition, styles } from "@uesio/ui"

interface Props {
  fieldLabel: string
  disabled: boolean
}

const StyleDefaults = Object.freeze({
  fieldset: ["grid", "gap-2", "p-2"],
  legend: ["hidden"],
})

const Fieldset: definition.UtilityComponent<Props> = (props) => {
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
