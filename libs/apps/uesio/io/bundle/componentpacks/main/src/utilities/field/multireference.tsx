import { collection, definition, component } from "@uesio/ui"
import ReferenceField, { ReferenceFieldProps } from "./reference"
import CollectionPicker from "./collectionpicker"
import { useState } from "react"
const { COLLECTION_FIELD } = collection

const MultiReferenceField: definition.UtilityComponent<ReferenceFieldProps> = (
  props,
) => {
  const Group = component.getUtility("uesio/io.group")
  const {
    path,
    fieldMetadata,
    mode,
    readonly,
    context,
    fieldId,
    record,
    setValue,
  } = props
  const recordCollection =
    (record?.getFieldValue(`${fieldId}->${COLLECTION_FIELD}`) as string) || ""
  const [collectionId, setCollectionId] = useState<string>(recordCollection)
  const referenceMetadata = fieldMetadata.getReferenceMetadata()
  const isReadMode = readonly || mode === "READ"
  return (
    <Group context={context}>
      {!isReadMode && (
        <CollectionPicker
          collections={referenceMetadata?.collections as string[]}
          value={collectionId}
          setValue={setCollectionId}
          context={context}
        />
      )}
      {collectionId && (
        <ReferenceField
          path={path}
          fieldId={fieldId}
          record={record}
          fieldMetadata={
            new collection.Field(
              {
                ...fieldMetadata.source,
                reference: {
                  collection: collectionId,
                  multiCollection: false,
                  collections: [],
                },
              },
              context,
            )
          }
          mode={mode}
          context={context}
          setValue={setValue}
        />
      )}
    </Group>
  )
}

export default MultiReferenceField
