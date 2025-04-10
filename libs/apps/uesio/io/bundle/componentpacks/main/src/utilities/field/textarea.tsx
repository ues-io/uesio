import { definition, styles, context, wire } from "@uesio/ui"
import { ApplyChanges } from "../../components/field/field"
import { useControlledInput } from "../../shared/useControlledFieldValue"
import ReadOnlyField from "./readonly"
export type LongTextFieldOptions = {
  cols?: number
  rows?: number
  language?: string
}

interface TextAreaFieldProps {
  setValue: (value: wire.FieldValue) => void
  value: wire.FieldValue
  mode?: context.FieldMode
  placeholder?: string
  options?: LongTextFieldOptions
  applyChanges?: ApplyChanges
  focusOnRender?: boolean
  readonly?: boolean
}

const StyleDefaults = Object.freeze({
  input: [],
  readonly: [],
})

const TextAreaField: definition.UtilityComponent<TextAreaFieldProps> = (
  props,
) => {
  const {
    id,
    mode,
    placeholder,
    options,
    setValue,
    applyChanges,
    readonly = false,
    focusOnRender = false,
    variant,
    context,
  } = props
  const value = props.value as string
  const readOnly = readonly || mode === "READ"

  const controlledInputProps = useControlledInput({
    value,
    setValue,
    applyChanges,
    readOnly,
  })

  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.field",
  )

  const commonProps = {
    id,
    placeholder,
    ...controlledInputProps,
    className: styles.cx(classes.input, readOnly && classes.readonly),
    disabled: readOnly,
    rows: options?.rows,
    cols: options?.cols,
  }

  if (readOnly) {
    return (
      <ReadOnlyField
        variant={variant}
        classes={{
          input: "whitespace-pre-line",
        }}
        context={context}
        id={id}
      >
        {value}
      </ReadOnlyField>
    )
  }

  return <textarea {...commonProps} autoFocus={focusOnRender} />
}

export default TextAreaField
