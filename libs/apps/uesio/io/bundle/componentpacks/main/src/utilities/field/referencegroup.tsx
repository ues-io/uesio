import {
  wire,
  api,
  collection,
  definition,
  component,
  context,
} from "@uesio/ui"
import TextField from "./text"

export type ReferenceGroupFieldOptions = {
  components?: definition.DefinitionList
  template?: string
}

interface ReferenceGroupFieldProps {
  path: string
  fieldMetadata: collection.Field
  fieldId: string
  mode: context.FieldMode
  record: wire.WireRecord
  options?: ReferenceGroupFieldOptions
}

const ReferenceGroupField: definition.UtilityComponent<
  ReferenceGroupFieldProps
> = (props) => {
  const { fieldMetadata, fieldId, record, context, variant, options, path } =
    props

  const referencedCollection = api.collection.useCollection(
    context,
    fieldMetadata.source.referencegroup?.collection || "",
  )
  if (!referencedCollection) return null
  const nameField = referencedCollection.getNameField()?.getId()
  if (!nameField) return null
  const template = options?.template
  const components = options?.components

  const itemToString = (item: wire.PlainWireRecord) => {
    if (template) {
      const itemContext = context.addRecordDataFrame(item)
      return itemContext.mergeString(template)
    }
    return (item[nameField] as string) || ""
  }

  const itemsToString = (item: wire.PlainWireRecord[] | undefined) => {
    const items: string[] = []
    if (!item) return ""
    for (const element of item) {
      items.push(itemToString(element))
    }
    return items.join(",")
  }

  const value = record.getFieldValue<wire.PlainWireRecord[]>(fieldId)

  if (components) {
    return value?.map((item, index) => (
      <component.Slot
        key={index}
        definition={options}
        listName="components"
        path={`${path}["referencegroup"]["${index}"]`}
        context={context.addRecordDataFrame(item)}
      />
    ))
  }

  return (
    <TextField
      value={itemsToString(value)}
      context={context}
      variant={variant}
      mode={"READ"}
    />
  )
}

export default ReferenceGroupField
