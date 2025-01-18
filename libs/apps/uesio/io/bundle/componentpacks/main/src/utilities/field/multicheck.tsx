import { definition, styles, context, collection, wire } from "@uesio/ui"
import Fieldset from "../fieldset/fieldset"
import CheckboxField from "./checkbox"

interface SelectFieldProps {
  setValue: (value: wire.PlainFieldValue[]) => void
  value: wire.PlainFieldValue[]
  width?: string
  fieldMetadata: collection.Field
  mode?: context.FieldMode
  options: wire.SelectOption[] | null
}

const StyleDefaults = Object.freeze({
  option: ["flex", "items-center", "gap-2"],
  label: ["text-sm", "text-slate-600", "font-light"],
})

const MultiCheckField: definition.UtilityComponent<SelectFieldProps> = (
  props,
) => {
  const { id, setValue, mode, options, context, fieldMetadata } = props

  const selectedVals = props.value

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const fieldLabel = fieldMetadata.getLabel()

  return (
    <Fieldset
      id={id}
      context={context}
      fieldLabel={fieldLabel}
      disabled={mode === "READ"}
    >
      {options
        ?.filter(({ value }) => value)
        .map((option) => {
          const optionId = `${fieldLabel}_check_${option.value}`.replace(
            / /g,
            "_",
          )
          return (
            <div className={classes.option} key={option.value}>
              <CheckboxField
                value={selectedVals.includes(option.value)}
                context={context}
                setValue={(checked: boolean) =>
                  setValue(
                    checked
                      ? // If we are selecting this value, append it to the array
                        selectedVals.concat(option.value)
                      : // If unselecting this value, get the current vals array without the current option
                        selectedVals.filter((val) => val !== option.value),
                  )
                }
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

export default MultiCheckField
