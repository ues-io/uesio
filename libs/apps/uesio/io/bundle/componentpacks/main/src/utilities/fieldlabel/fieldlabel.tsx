import { definition, styles } from "@uesio/ui"

interface FieldLabelProps {
  label?: string
  // The id of the input element that this is the label for
  labelFor?: string
}

const StyleDefaults = Object.freeze({
  root: [],
})

const FieldLabel: definition.UtilityComponent<FieldLabelProps> = (props) => {
  const { label, context, labelFor } = props
  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.fieldlabel",
  )
  return (
    <label className={classes.root} htmlFor={labelFor}>
      {context.mergeString(label)}
    </label>
  )
}

export default FieldLabel
