import { component, definition, api, metadata, wire } from "@uesio/ui"
import { getComponentById } from "../../api/stateapi"

type ParamsFieldDefinition = {
  fieldId: string
  viewIdField?: string
  viewComponentIdField?: string
  label?: string
  labelPosition?: string
  wrapperVariant?: metadata.MetadataKey
  textVariant?: metadata.MetadataKey
}

type ViewComponentDefinition = {
  view: string
} & definition.BaseDefinition

const ParamsField: definition.UC<ParamsFieldDefinition> = (props) => {
  const MapField = component.getUtility("uesio/io.mapfield")
  const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
  const {
    context,
    definition: {
      fieldId,
      label,
      labelPosition,
      viewIdField,
      viewComponentIdField,
      wrapperVariant,
    },
  } = props

  const record = context.getRecord()

  if (!record) return null

  let view
  if (viewIdField) {
    view = record.getFieldValue<string>(viewIdField)
  } else if (viewComponentIdField) {
    const viewComponentId = record.getFieldValue<string>(viewComponentIdField)
    if (viewComponentId) {
      const componentProps = getComponentById(
        context,
        viewComponentId,
      ) as ViewComponentDefinition
      if (componentProps) {
        view = componentProps.view
      }
    }
  }

  const paramsDef = api.view.useViewDef(view)?.params as Record<
    string,
    Record<"type", string>
  >

  if (!view || !paramsDef) return null

  const params = record.getFieldValue(fieldId)

  return (
    <FieldWrapper
      label={label}
      labelPosition={labelPosition}
      context={context}
      variant={wrapperVariant}
    >
      <MapField
        value={params}
        setValue={(value: wire.FieldValue) =>
          record.update(fieldId, value, context)
        }
        mode="EDIT"
        context={context}
        options={{
          noAdd: true,
          noDelete: true,
          keys: Object.keys(paramsDef),
          keyField: {
            name: "key",
            label: "Param",
            updateable: false,
            createable: false,
          },
          valueField: {
            name: "value",
            label: "Value",
          },
        }}
      />
    </FieldWrapper>
  )
}

export default ParamsField
