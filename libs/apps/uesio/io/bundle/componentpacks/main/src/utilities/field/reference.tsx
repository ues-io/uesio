import {
  wire,
  api,
  collection,
  definition,
  context,
  component,
  metadata,
} from "@uesio/ui"

import debounce from "lodash/debounce"
import { useState, useEffect } from "react"
import CustomSelect from "../customselect/customselect"
import ReadOnlyField from "./readonly"

export type ReferenceFieldOptions = {
  searchFields?: string[]
  returnFields?: string[]
  order?: wire.OrderState[]
  components?: definition.DefinitionList
  template?: string
  requirewriteaccess?: boolean
  conditions?: wire.WireConditionState[]
  collection?: string
}

export interface ReferenceFieldProps {
  path: string
  fieldId: string
  fieldMetadata: collection.Field
  mode: context.FieldMode
  readonly?: boolean
  record?: wire.WireRecord
  options?: ReferenceFieldOptions
  placeholder?: string
  setValue?: (value: wire.PlainWireRecord | null) => void
}

const displayTemplateFieldPattern = /\${(.*?)}/g

// Build an intersection of all fields to return by extracting fields from the display template
// and combining with the search and return fields
const getReturnFields = (
  displayTemplate: string | undefined,
  returnFields: string[] = [],
  searchFields: string[] = [],
) => {
  const extractedFields = displayTemplate
    ? displayTemplate.match(displayTemplateFieldPattern)
    : null
  return Array.from(
    new Set<string>(
      returnFields.concat(
        searchFields,
        extractedFields ? extractedFields.map((f) => f.slice(2, -1)) : [],
      ),
    ),
  )
}

const isValueCondition = wire.isValueCondition

const ReferenceField: definition.UtilityComponent<ReferenceFieldProps> = (
  props,
) => {
  const {
    fieldId,
    fieldMetadata,
    mode,
    readonly,
    record,
    context,
    options = {},
    path,
    placeholder,
    variant,
    id,
    setValue,
  } = props

  const referencedCollection = api.collection.useCollection(
    context,
    fieldMetadata.getReferenceMetadata()?.collection || "",
  )

  const nameField = referencedCollection?.getNameField()?.getId()
  const currentItem =
    record?.getFieldValue<wire.PlainWireRecord>(fieldId) || null

  const [items, setItems] = useState<wire.PlainWireRecord[]>([])
  const [item, setItem] = useState<wire.PlainWireRecord | null>(currentItem)

  useEffect(() => {
    if (item === currentItem || !record) return
    setItem(currentItem)
  }, [currentItem, item, record])

  if (!referencedCollection || !nameField) return null

  const {
    components,
    conditions,
    order = [
      {
        field: nameField as metadata.MetadataKey,
        desc: false,
      },
    ],
    requirewriteaccess = false,
    template,
  } = options
  let { searchFields, returnFields } = options

  if (!returnFields) {
    returnFields = searchFields || [nameField]
  }
  if (!searchFields) {
    searchFields = returnFields || [nameField]
  }

  const renderer = (item: wire.PlainWireRecord) => {
    if (components) {
      const recordid = item[collection.ID_FIELD]
      return (
        <component.Slot
          definition={options}
          listName="components"
          path={`${path}["reference"]["${recordid}"]`}
          context={context.addRecordDataFrame(item)}
        />
      )
    }
    if (template) {
      return context.addRecordDataFrame(item).mergeString(template)
    }
    return (item[nameField] ||
      item[collection.UNIQUE_KEY_FIELD] ||
      item[collection.ID_FIELD]) as string
  }

  const onSearch = debounce(async (search: string) => {
    if (!wire) return
    // Loop over the conditions and merge their values
    const extraConditions: wire.WireConditionState[] = (conditions || []).map(
      (condition) => {
        if (!isValueCondition(condition)) return condition
        return {
          ...condition,
          value: context.merge(condition.value as string),
        } as wire.WireConditionState
      },
    )

    const result = await api.platform.loadData(context, {
      wires: [
        {
          name: "search",
          batchnumber: 0,
          batchid: "",
          view: context.getViewId() || "",
          query: true,
          collection: referencedCollection.getFullName(),
          fields: getReturnFields(template, returnFields, searchFields).map(
            (fieldName) => ({
              id: fieldName,
            }),
          ),
          conditions: [
            ...extraConditions,
            {
              type: "SEARCH",
              value: search,
              fields: searchFields,
            },
          ],
          requirewriteaccess,
          order,
        },
      ],
    })
    setItems(Object.values(result.wires[0].data) || [])
  }, 200)
  const isReadMode = readonly || mode === "READ"
  if (isReadMode) {
    return (
      <ReadOnlyField variant={variant} context={context} id={id}>
        {item ? renderer(item) : ""}
      </ReadOnlyField>
    )
  }
  return (
    <CustomSelect
      id={id}
      items={items}
      itemRenderer={renderer}
      variant={variant}
      context={context}
      selectedItems={item ? [item] : []}
      isSelected={() => false}
      onSearch={onSearch}
      placeholder={placeholder}
      onSelect={(item: wire.PlainWireRecord) => {
        record?.update(fieldId, item, context)
        setValue?.(item)
        setItem(item)
      }}
      onUnSelect={() => {
        record?.update(fieldId, null, context)
        setValue?.(null)
        setItem(null)
      }}
      getItemKey={(item: wire.PlainWireRecord) =>
        item[collection.ID_FIELD] as string
      }
    />
  )
}

export default ReferenceField
