import { collection, definition, component, api, metadata } from "@uesio/ui"
import { useMemo, useState } from "react"
import { sortMetadata } from "./metadata"

interface Props {
  collections?: string[]
  value: string
  setValue: (value: string) => void
}

const getOptions = (
  metadata: Record<string, metadata.MetadataInfo>,
  selectedCollections: string[] | undefined,
) => {
  let useMetadata = metadata
  if (selectedCollections?.length) {
    useMetadata = selectedCollections.reduce(
      (acc, collection) => {
        acc[collection] = metadata[collection]
        return acc
      },
      {} as Record<string, metadata.MetadataInfo>,
    )
  }
  return collection.addBlankSelectOption(
    sortMetadata(useMetadata).map((x: metadata.MetadataInfo) => ({
      label: x.label || x.key,
      value: x.key,
    })),
  )
}

const CollectionPicker: definition.UtilityComponent<Props> = (props) => {
  const SelectField = component.getUtility("uesio/io.selectfield")
  const { collections, value, context, setValue } = props
  const [selectedCollection, setSelectedCollection] = useState<string>(value)
  const [metadata] = api.builder.useMetadataList(context, "COLLECTION", "")
  const options = useMemo(
    () => (metadata ? getOptions(metadata, collections) : undefined),
    [metadata, collections],
  )
  if (!options || !options.length) return null
  return (
    <SelectField
      context={context}
      value={selectedCollection}
      options={options}
      setValue={(value: string) => {
        setSelectedCollection(value)
        setValue(value)
      }}
    />
  )
}

export default CollectionPicker
