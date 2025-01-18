import { wire, context, component, definition } from "@uesio/ui"
import { getDefAtPath, set as setDef } from "../api/defapi"
import {
  ComponentProperty,
  PropertyOnChange,
} from "../properties/componentproperty"
import get from "lodash/get"
import { FullPath } from "../api/path"
import propertyTypeHandlers from "./handlers"
import set from "lodash/set"
import { getComponentDef } from "../api/stateapi"

const PATH_ARROW = "->"
const LODASH_PATH_SEPARATOR = "."

type SetterFunction = (
  value: wire.FieldValue,
  field: string | undefined,
  record: wire.WireRecord,
) => void

type PropertyTypeHandler = {
  onUpdate?: (property: ComponentProperty) => void
  onChange?: (property: ComponentProperty) => void
  getField: (
    property: ComponentProperty,
    context: context.Context,
    currentValue: wire.PlainWireRecord,
    path: FullPath,
  ) => wire.ViewOnlyField
  getValue?: (
    def: definition.Definition,
    property: ComponentProperty,
    context: context.Context,
    currentValue: wire.PlainWireRecord,
    path: FullPath,
  ) => wire.FieldValue
  getSetters?: (
    def: definition.Definition,
    property: ComponentProperty,
    context: context.Context,
    currentValue: wire.PlainWireRecord,
    path: FullPath,
  ) => SetterFunction[]
}

const getBaseWireFieldDef = (
  ComponentProperty: ComponentProperty,
  type: wire.FieldType,
  additional?: object,
): wire.ViewOnlyField => {
  const { name, label, required } = ComponentProperty
  return {
    label: label || name,
    required: required || false,
    type,
    ...additional,
  }
}

const getPropertyId = (property: ComponentProperty) =>
  `${property.type === "COMPONENT_ID" ? component.COMPONENT_ID : property.name}`

// lightweight wrapper around lodash get which uses simple object property retrieval
// if there's no nested property syntax (i.e. "foo->bar" will use lodash get with "foo.bar")
const getObjectProperty = (
  object: wire.PlainWireRecord,
  property: string,
): wire.PlainFieldValue => {
  if (property.includes(PATH_ARROW)) {
    return get(
      object,
      property.replace(PATH_ARROW, LODASH_PATH_SEPARATOR),
    ) as wire.PlainFieldValue
  } else {
    return object[property] as wire.PlainFieldValue
  }
}

const getWireFields = (
  properties: ComponentProperty[] | undefined,
  context: context.Context,
  initialValue: wire.PlainWireRecord = {},
  path: FullPath,
) =>
  Object.fromEntries(
    (properties || []).map((property) => {
      const handler =
        propertyTypeHandlers[property.type] || propertyTypeHandlers.TEXT

      return [
        getPropertyId(property),
        handler.getField(property, context, initialValue, path),
      ]
    }),
  )

const getPropPathFromName = (
  name: string,
  path: FullPath,
): [FullPath, string[], boolean] => {
  const nameParts = name.split(PATH_ARROW)
  const isNestedProperty = nameParts.length > 1
  const propPath = nameParts.reduce(
    (newPath, part) => newPath.addLocal(part),
    path,
  )
  return [propPath, nameParts, isNestedProperty]
}

// Finds the closest parent node that provides wire or record context,
// and extracts the associated wire property from that node
function getClosestWireInContext(def: definition.Definition, path: FullPath) {
  let wireId
  let [lastItem, newPath] = path.pop()
  while (lastItem && !wireId) {
    // If the current item looks like a metadata name, try to fetch it as a component type
    if (lastItem?.includes("/")) {
      const componentDef = getComponentDef(lastItem)
      if (componentDef?.slots?.length) {
        let match
        outerLoop: for (const slot of componentDef.slots) {
          if (!slot?.providesContexts) continue
          for (const contextProvision of slot.providesContexts) {
            if (
              contextProvision?.type === "WIRE" ||
              contextProvision?.type === "RECORD"
            ) {
              match = contextProvision
              break outerLoop
            }
          }
        }
        if (match?.wireProperty) {
          wireId = getDefAtPath(
            def,
            newPath.addLocal(lastItem).addLocal(match.wireProperty),
          ) as string
        }
      }
    }
    if (newPath) {
      ;[lastItem, newPath] = newPath.pop()
    } else {
      break
    }
  }
  return wireId
}

const getInitialValue = (
  def: definition.Definition,
  properties: ComponentProperty[] | undefined,
  context: context.Context,
  path: FullPath,
): wire.PlainWireRecord => {
  const initialValue = {}
  properties?.forEach((property) => {
    let handler = propertyTypeHandlers[property.type]
    if (!handler || !handler.getValue) handler = propertyTypeHandlers.TEXT
    const value = handler.getValue?.(def, property, context, initialValue, path)
    if (value !== undefined) {
      set(
        initialValue,
        [property.name.replace(PATH_ARROW, LODASH_PATH_SEPARATOR)],
        value,
      )
    }
  })
  return initialValue
}

const getChangeHandlers = (properties: ComponentProperty[] | undefined) => {
  const onChangeHandlers: Record<string, PropertyOnChange[]> = {}
  properties?.forEach((property) => {
    const { onChange } = property
    const name = getPropertyId(property)

    if (onChange?.length) {
      onChangeHandlers[name] = onChange
    }
  })
  return onChangeHandlers
}

const addToSettersMap = (
  settersMap: Map<string, SetterFunction[]>,
  key: string,
  setters: SetterFunction[],
) => {
  const existingSetter = settersMap.get(key)
  if (existingSetter) {
    existingSetter.push(...setters)
  } else {
    settersMap.set(key, setters)
  }
}

const getSetters = (
  def: definition.Definition,
  properties: ComponentProperty[] | undefined,
  context: context.Context,
  initialValue: wire.PlainWireRecord,
  path: FullPath,
): Map<string, SetterFunction[]> => {
  const setters = new Map()
  properties?.forEach((property) => {
    const name = getPropertyId(property)
    let handler = propertyTypeHandlers[property.type]
    if (!handler || !handler.getSetters) handler = propertyTypeHandlers.TEXT
    const propSetters = handler.getSetters?.(
      def,
      property,
      context,
      initialValue,
      path,
    )
    propSetters && addToSettersMap(setters, name, propSetters)
  })
  return setters
}

const getOnUpdate = (
  def: definition.Definition,
  properties: ComponentProperty[] | undefined,
  context: context.Context,
  initialValue: wire.PlainWireRecord,
  path: FullPath,
) => {
  const onChangeHandlers = getChangeHandlers(properties)
  const setters = getSetters(def, properties, context, initialValue, path)

  return (field: string, value: wire.FieldValue, record: wire.WireRecord) => {
    let setter = setters.get(field)
    let setterField: string | undefined
    // If there is no setter, and the field is nested, then walk up the tree
    // to see if there is a setter registered for the parent field
    if (!setter) {
      const fieldParts = field.split(PATH_ARROW)
      if (fieldParts.length > 1) {
        const popped = []
        while (fieldParts.length) {
          popped.push(fieldParts.pop())
          const parentField = fieldParts.join(PATH_ARROW)
          setter = setters.get(parentField)
          if (setter) {
            setterField = popped.join(PATH_ARROW)
            break
          }
        }
      }
    }

    setter?.forEach((s) => {
      s(value, setterField, record)
    })

    // Finally, once all setters have run, apply any on-Change handlers
    if (onChangeHandlers[field]?.length) {
      const onChangeHandlerContext = context.addRecordFrame({
        record: record.getId(),
        wire: record.getWire().getId(),
      })
      onChangeHandlers[field].forEach((onChange) => {
        if (
          !onChange.conditions?.length ||
          component.shouldAll(onChange.conditions, onChangeHandlerContext)
        ) {
          onChange.updates?.forEach(
            ({ field: targetField, value: newValue }) => {
              const [targetPath] = getPropPathFromName(targetField, path)
              setDef(context, targetPath, newValue)
            },
          )
        }
      })
    }
  }
}

export {
  getBaseWireFieldDef,
  getObjectProperty,
  getPropertyId,
  getInitialValue,
  getWireFields,
  getPropPathFromName,
  getClosestWireInContext,
  getOnUpdate,
  PATH_ARROW,
  LODASH_PATH_SEPARATOR,
}
export type { PropertyTypeHandler, SetterFunction }
