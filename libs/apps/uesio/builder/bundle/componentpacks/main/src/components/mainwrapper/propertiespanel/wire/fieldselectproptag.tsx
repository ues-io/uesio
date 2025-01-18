import { definition, metadata, collection, component, context } from "@uesio/ui"
import { FullPath } from "../../../../api/path"

import { getBuilderNamespace } from "../../../../api/stateapi"
import ActionButton from "../../../../helpers/actionbutton"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"
import ItemTag from "../../../../utilities/itemtag/itemtag"

type Props = {
  setReferencePath: (path: FullPath) => void
  onSelect?: (ctx: context.Context, path: FullPath) => void
  onUnselect?: (ctx: context.Context, path: FullPath) => void
  fieldMetadata: collection.Field
  path: FullPath
  selected: boolean
  allowReferenceTraversal?: boolean
}
const FieldSelectPropTag: definition.UtilityComponent<Props> = (props) => {
  const Text = component.getUtility("uesio/io.text")
  const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")
  const {
    allowReferenceTraversal = true,
    fieldMetadata,
    context,
    onSelect,
    onUnselect,
    path,
    selected,
    setReferencePath,
  } = props
  const fieldId = fieldMetadata.getId()

  const isStruct = fieldMetadata.getType() === "STRUCT"
  const isReference = fieldMetadata.isReference()
  const supportsTraversal = allowReferenceTraversal && (isStruct || isReference)
  const nsInfo = getBuilderNamespace(context, fieldId as metadata.MetadataKey)

  return (
    <PropNodeTag
      key={fieldId}
      selected={selected}
      context={context}
      onClick={(e: MouseEvent) => {
        e.stopPropagation()
        selected ? onUnselect?.(context, path) : onSelect?.(context, path)
      }}
    >
      <ItemTag context={context}>
        <NamespaceLabel
          context={context}
          metadatainfo={nsInfo}
          metadatakey={fieldId}
          title={fieldMetadata.getLabel()}
        />

        <Text
          variant="uesio/builder.infobadge"
          text={fieldMetadata.getType()}
          context={context}
        />
      </ItemTag>
      {supportsTraversal && (
        <BuildActionsArea context={context}>
          <ActionButton
            title={`${
              isReference
                ? "Select Fields on referenced collection"
                : `Select Sub-field of ${fieldMetadata.getType()} field`
            }`}
            icon={"arrow_forward"}
            onClick={(e) => {
              e.stopPropagation()
              setReferencePath(path.addLocal("fields"))
            }}
            context={context}
          />
        </BuildActionsArea>
      )}
    </PropNodeTag>
  )
}

export default FieldSelectPropTag
