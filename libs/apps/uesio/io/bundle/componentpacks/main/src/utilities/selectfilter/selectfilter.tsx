import { definition, api, wire, collection } from "@uesio/ui"
import SelectField from "../field/select"

const addBlankSelectOption = collection.addBlankSelectOption

interface SelectFilterProps {
  path: string
  wire: wire.Wire
  fieldMetadata: collection.Field
  condition: wire.ValueConditionState
}

const SelectFilter: definition.UtilityComponent<SelectFilterProps> = (
  props,
) => {
  const { wire, fieldMetadata, context, condition, variant } = props
  const wireId = wire.getId()

  return (
    <SelectField
      context={context}
      options={addBlankSelectOption(
        fieldMetadata.getSelectOptions({
          addBlankOption: false,
          context,
        }),
        "Any " + fieldMetadata.getLabel(),
      )}
      variant={variant}
      value={condition.value || ""}
      setValue={(value: string) => {
        api.signal.runMany(
          [
            {
              signal: "wire/SET_CONDITION",
              wire: wireId,
              condition: {
                ...condition,
                value,
                inactive: !value,
              },
            },
            {
              signal: "wire/LOAD",
              wires: [wireId],
            },
          ],
          context,
        )
      }}
    />
  )
}

export default SelectFilter
