import { definition, api, wire } from "@uesio/ui"
import ToggleField from "../field/toggle"

export interface ToggleFilterProps {
  path: string
  wire: wire.Wire
  condition: wire.ValueConditionState
}

const ToggleFilter: definition.UtilityComponent<ToggleFilterProps> = (
  props,
) => {
  const { wire, context, condition } = props
  const wireId = wire.getId()

  return (
    <ToggleField
      context={context}
      variant={"uesio/io.filter"}
      value={!condition.inactive}
      setValue={() => {
        api.signal.runMany(
          [
            {
              signal: "wire/TOGGLE_CONDITION",
              wire: wireId,
              conditionId: condition.id,
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

export default ToggleFilter
