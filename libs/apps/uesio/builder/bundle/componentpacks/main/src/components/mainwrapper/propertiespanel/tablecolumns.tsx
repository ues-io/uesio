import { component, context, definition } from "@uesio/ui"
import { add, get, remove, set } from "../../../api/defapi"
import {
  getComponentDef,
  setSelectedPath,
  useSelectedPath,
} from "../../../api/stateapi"
import {
  ComponentProperty,
  FieldMetadataProperty,
  FieldProperty,
} from "../../../properties/componentproperty"

import PropNodeTag from "../../../utilities/propnodetag/propnodetag"
import ItemTag from "../../../utilities/itemtag/itemtag"
import { useRef, useState } from "react"
import FieldPicker from "./wire/fieldpicker"
import { FullPath } from "../../../api/path"
import { getWirePath, getWireProperty } from "../../../api/wireapi"

export type ColumnDefinition = {
  field?: string
  label?: string
  components?: definition.DefinitionList
  type?: "" | "custom"
} & definition.BaseDefinition

const columnTypeProperty: ComponentProperty = {
  name: "type",
  type: "SELECT",
  label: "Column Type",
  options: [
    { value: "", label: "Field" },
    { value: "custom", label: "Components" },
  ],
  // Populate / remove components array if this field is changed
  onChange: [
    {
      conditions: [
        {
          field: "type",
          value: "custom",
          type: "fieldValue",
        },
      ],
      updates: [{ field: "components", value: [] }, { field: "field" }],
    },
    {
      conditions: [
        {
          field: "type",
          value: "",
          type: "fieldValue",
        },
      ],
      updates: [{ field: "components" }],
    },
  ],
}
const labelProperty: ComponentProperty = {
  name: "label",
  type: "TEXT",
  label: "Column Label",
}
const widthProperty: ComponentProperty = {
  name: "width",
  type: "TEXT",
  label: "Column Width",
}

const TABLE_TYPE = "uesio/io.table"

const isCustomColumn = (column: ColumnDefinition) =>
  (column?.components?.length || 0) > 0 || column?.type === "custom"

const getColumnTitle = (column: ColumnDefinition) => {
  if (isCustomColumn(column)) {
    return "Components" + (column.label ? `: ${column.label}` : "")
  } else {
    return `Field: ${column?.field || '["Not set"]'}`
  }
}

const getComponentType = (def: definition.DefinitionMap): string =>
  Object.keys(def)[0] as string

/**
 * Converts the Field Picker FullPath of a selected field to a field selector, e.g. "uesio/core.owner->uesio/core.firstname")
 * @param path FullPath
 * @returns string
 */
const transformFieldPickerPath = (path: FullPath) =>
  component.path
    .toPath(path.localPath)
    .filter((x) => x !== "fields")
    .join("->")

export const isSelected = (
  columns: ColumnDefinition[],
  fieldPickerPath: FullPath,
  fieldId: string,
) => {
  if (!columns || !columns.length) return false
  const qualifiedFieldId = transformFieldPickerPath(
    fieldPickerPath.addLocal(fieldId),
  )
  return columns.some((e) => {
    const columnField = e.field as string
    if (!columnField) return false
    //  direct match
    if (columnField === qualifiedFieldId) return true
    // check if the column field starts with the qualified picker path,
    // as long as we have a qualified path to check for (which will not be true top-level)
    return qualifiedFieldId && columnField.startsWith(qualifiedFieldId)
  })
}

const TableColumns: definition.UC = (props) => {
  const { context } = props

  const ListPropertyUtility = component.getUtility("uesio/builder.listproperty")
  const Popper = component.getUtility("uesio/io.popper")
  // eslint-disable-next-line react-hooks/rules-of-hooks -- waiting on release of https://github.com/facebook/react/pull/31720
  const anchorEl = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- waiting on release of https://github.com/facebook/react/pull/31720
  const [showPopper, setShowPopper] = useState(false)

  // eslint-disable-next-line react-hooks/rules-of-hooks -- waiting on release of https://github.com/facebook/react/pull/31720
  let selectedPath = useSelectedPath(context)
  let localPath
  let tempPath = selectedPath
  // This is a bit of a hack to ensure we're always rendering the TABLE's path, not a nested path
  while (true) {
    ;[localPath, tempPath] = tempPath.pop()
    if (localPath === TABLE_TYPE) {
      selectedPath = tempPath.addLocal(TABLE_TYPE)
      break
    }
    // If we get to where we have no localPath, add the component type to the original path
    if (!localPath) {
      selectedPath = selectedPath.addLocal(TABLE_TYPE)
      break
    }
  }

  const columnsPath = selectedPath.addLocal("columns")

  // Get wire name from parent table,
  // in order to build a FIELD property that only shows fields from that wire
  const [, tablePath] = columnsPath.pop()
  const wireName = get(context, tablePath.addLocal("wire")) as string
  const wireCollection = getWireProperty(
    context,
    wireName,
    "collection",
  ) as string
  const wireFieldsPath = getWirePath(context, wireName).addLocal("fields")
  const fieldComponentDef = getComponentDef("uesio/io.field")
  const columns = get(context, columnsPath) as ColumnDefinition[]

  const onSelect = (ctx: context.Context, path: FullPath) => {
    const numColumns = columns?.length || 0
    if (numColumns === 0) {
      add(context, columnsPath.addLocal("0"), {})
    }
    set(
      ctx,
      columnsPath.addLocal(`${numColumns}`).addLocal("field"),
      transformFieldPickerPath(path),
    )
    // ADD the selected field to the wire as well to keep it in sync
    set(ctx, wireFieldsPath.merge(path), null)
  }

  const onUnselect = (ctx: context.Context, path: FullPath) => {
    const qualifiedFieldId = transformFieldPickerPath(path)
    const index = columns.findIndex((e) => e.field === qualifiedFieldId)
    if (index > -1) remove(ctx, columnsPath.addLocal(index.toString()))
  }

  const getColumnProperties = (column: ColumnDefinition) => {
    // If the column has components, then the individual components can be edited through their child components,
    // but we still want to specify COLUMN properties
    if (isCustomColumn(column)) {
      return [columnTypeProperty, widthProperty, labelProperty]
    }
    const ioFieldProperties = (fieldComponentDef?.properties ||
      []) as ComponentProperty[]

    const fieldProperty = {
      ...ioFieldProperties.find((p) => p.name === "fieldId"),
      wireName,
      name: "field",
      label: "Field",
    } as FieldProperty
    delete fieldProperty.wireField

    const fieldDisplayTypeProperty = {
      ...ioFieldProperties.find((p) => p.name === "fieldDisplayType"),
      wireName,
      fieldProperty: "field",
    } as FieldMetadataProperty
    delete fieldDisplayTypeProperty.wireProperty

    const referenceCollection = {
      ...ioFieldProperties.find((p) => p.name === "referenceCollection"),
      wireName,
      fieldProperty: "field",
    } as FieldMetadataProperty
    delete referenceCollection.wireProperty

    const isMultiCollectionReference = {
      ...ioFieldProperties.find((p) => p.name === "isMultiCollectionReference"),
      wireName,
      fieldProperty: "field",
    } as FieldMetadataProperty
    delete isMultiCollectionReference.wireProperty

    const tableFieldProperties: ComponentProperty[] = [
      columnTypeProperty,
      fieldProperty,
      fieldDisplayTypeProperty,
      referenceCollection,
      isMultiCollectionReference,
      widthProperty,
      labelProperty,
    ]

    return tableFieldProperties.concat(ioFieldProperties.slice(7))
  }

  const getItemChildren = (column: ColumnDefinition, itemIndex: number) => {
    if (!column?.components?.length) return null
    const columnPath = columnsPath.addLocal(`${itemIndex}`)
    const columnComponentsPath = columnPath.addLocal("components")
    return column.components.map((component, cmpIdx) => {
      const itemPath = columnComponentsPath.addLocal(`${cmpIdx}`)
      return (
        <PropNodeTag
          key={itemIndex}
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
            setSelectedPath(context, itemPath)
          }}
          selected={selectedPath.startsWith(itemPath)}
          context={context}
        >
          <ItemTag context={context}>{getComponentType(component)}</ItemTag>
        </PropNodeTag>
      )
    })
  }

  return (
    <div ref={anchorEl}>
      {showPopper && anchorEl && (
        <Popper
          referenceEl={anchorEl.current}
          context={context}
          placement="right-start"
          autoPlacement={["right-start"]}
          offset={8}
          parentSelector="#propertieswrapper"
          matchHeight
        >
          <FieldPicker
            context={context}
            baseCollectionKey={wireCollection}
            onClose={() => setShowPopper(false)}
            onSelect={onSelect}
            onUnselect={onUnselect}
            allowMultiselect={true}
            isSelected={(
              ctx: context.Context,
              path: FullPath,
              fieldId: string,
            ) => isSelected(columns, path, fieldId)}
          />
        </Popper>
      )}
      <ListPropertyUtility
        context={context}
        path={columnsPath}
        actions={[
          {
            label: "Add Column",
            action: () => {
              add(context, columnsPath.addLocal(`${columns?.length || 0}`), {})
            },
          },
          {
            label: "Add Fields",
            action: () => {
              setShowPopper(true)
            },
          },
        ]}
        items={columns}
        itemProperties={getColumnProperties}
        itemDisplayTemplate={getColumnTitle}
        itemPropertiesPanelTitle="Column Properties"
        itemChildren={getItemChildren}
      />
    </div>
  )
}

TableColumns.displayName = "TableColumns"

export default TableColumns
