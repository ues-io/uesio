import { api, component, context, definition, wire } from "@uesio/ui"
import { get as getDef } from "../api/defapi"
import { ComponentProperty } from "../properties/componentproperty"
import { FullPath } from "../api/path"

import {
  getInitialValue,
  getOnUpdate,
  getWireFields,
} from "../propertyhandlers/handlerutils"

type Props = {
  properties?: ComponentProperty[]
  content?: definition.DefinitionList
  path: FullPath
}

const getPropertiesContext = (context: context.Context, wire?: wire.Wire) => {
  if (wire) {
    const record = wire.getFirstRecord()?.getId()
    if (record) {
      return context.addRecordFrame({
        wire: wire.getId(),
        record,
      })
    }
  }
  return context
}

export const getFormFields = (
  properties: ComponentProperty[] = [],
  path: FullPath,
) =>
  properties.map((property) => ({
    "uesio/builder.property": {
      property,
      path,
    },
  }))

const PropFormInternal: definition.UtilityComponent<Props> = (props) => {
  const DynamicForm = component.getUtility("uesio/io.dynamicform")
  const { properties, content, path, id } = props

  const pathString = path?.combine()
  const wire = api.wire.useWire("dynamicwire:" + id, props.context)
  const context = getPropertiesContext(props.context, wire)
  const def = getDef(context, path.getBase())
  const initialValue = getInitialValue(def, properties, context, path)
  const onUpdate = getOnUpdate(def, properties, context, initialValue, path)

  return (
    <DynamicForm
      id={id}
      path={pathString}
      fields={getWireFields(properties, context, initialValue, path)}
      content={content || getFormFields(properties, path)}
      context={context}
      onUpdate={onUpdate}
      initialValue={initialValue}
    />
  )
}

export default PropFormInternal
