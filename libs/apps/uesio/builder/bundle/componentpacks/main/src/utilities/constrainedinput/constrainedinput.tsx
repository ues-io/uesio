import {
  definition,
  component,
  context,
  metadata,
  wire,
  styles,
} from "@uesio/ui"
import { useEffect, useState } from "react"

interface ConstrainedInputProps {
  setValue: (value: wire.FieldValue) => void
  value: wire.FieldValue
  label: string
  labelPosition?: string
  mode?: context.FieldMode
  fieldWrapperVariant?: metadata.MetadataKey
  fieldComponentType: metadata.MetadataKey
  fieldComponentProps: definition.UtilityProps
}

const StyleDefaults = Object.freeze({
  root: ["grid", "grid-cols-[1fr_max-content]", "gap-1"],
  button: ["p-1", "text-slate-200"],
})

const ConstrainedInput: definition.UtilityComponent<ConstrainedInputProps> = (
  props,
) => {
  const {
    context,
    fieldWrapperVariant,
    labelPosition,
    mode = "READ",
    value,
    setValue,
    label,
    fieldComponentProps,
    fieldComponentType,
  } = props

  useEffect(() => {
    setControlledValue(value)
  }, [value])

  const [inEditMode, setEditMode] = useState<boolean>(mode === "EDIT")
  const [controlledValue, setControlledValue] = useState<wire.FieldValue>(value)

  const onClickButton = () => {
    // If we are currently in edit mode, NOW we want to apply our update
    if (inEditMode) {
      setEditMode(false)
      setValue(controlledValue)
    } else {
      setEditMode(true)
    }
  }

  const IconButton = component.getUtility("uesio/io.iconbutton")
  const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
  const FieldComponent = component.getUtility(fieldComponentType)

  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.field",
  )

  return (
    <FieldWrapper
      label={label}
      labelPosition={labelPosition}
      context={context}
      variant={fieldWrapperVariant}
    >
      <div className={classes.root}>
        <FieldComponent
          {...fieldComponentProps}
          mode={inEditMode ? "EDIT" : "READ"}
          value={controlledValue}
          setValue={setControlledValue}
          context={context}
          focusOnRender={true}
        />
        <IconButton
          onClick={onClickButton}
          icon={inEditMode ? "done" : "edit"}
          context={context}
          label={inEditMode ? "Apply change" : "Click to change value"}
          tooltipPlacement={"bottom-start"}
          className={classes.button}
        />
      </div>
    </FieldWrapper>
  )
}

ConstrainedInput.displayName = "ConstrainedInput"

export default ConstrainedInput
