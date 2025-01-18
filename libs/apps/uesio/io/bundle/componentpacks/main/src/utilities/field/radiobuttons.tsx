import { definition, styles, context, collection, wire } from "@uesio/ui"
import Fieldset from "../fieldset/fieldset"

interface SelectFieldProps {
  setValue: (value: wire.FieldValue) => void
  value?: wire.FieldValue
  fieldMetadata: collection.Field
  fieldId: string
  mode?: context.FieldMode
  options: wire.SelectOption[] | null
  readonly?: boolean
}

const StyleDefaults = Object.freeze({
  option: ["flex", "items-center", "gap-2"],
  label: ["text-sm", "text-slate-600", "font-light"],
})

const RadioButtons: definition.UtilityComponent<SelectFieldProps> = (props) => {
  const {
    setValue,
    value = {},
    mode,
    options,
    context,
    fieldMetadata,
    readonly,
    id,
  } = props

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const fieldLabel = fieldMetadata.getLabel()
  return (
    <Fieldset
      fieldLabel={fieldLabel}
      context={context}
      disabled={readonly || mode === "READ"}
    >
      {options
        ?.filter(({ value }) => value)
        .map((option) => {
          const optionId = `${id}_radio_${option.value}`.replace(/ /g, "_")
          return (
            <div className={classes.option} key={option.value}>
              <input
                id={optionId}
                value={option.value}
                type={"radio"}
                checked={option.value === value}
                name={optionId}
                onChange={(e) => setValue(e.target.value)}
              />
              <label className={classes.label} htmlFor={optionId}>
                {option.label}
              </label>
            </div>
          )
        })}
    </Fieldset>
  )
}

export default RadioButtons
