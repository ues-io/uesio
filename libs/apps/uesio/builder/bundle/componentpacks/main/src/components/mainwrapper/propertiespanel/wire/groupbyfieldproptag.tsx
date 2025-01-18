import { component, definition, wire, api, metadata } from "@uesio/ui"

import DeleteAction from "../../../../actions/deleteaction"
import MoveActions from "../../../../actions/moveactions"
import { FullPath } from "../../../../api/path"
import { getBuilderNamespace, setSelectedPath } from "../../../../api/stateapi"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"
import ItemTag from "../../../../utilities/itemtag/itemtag"
import PropertiesForm from "../../../../helpers/propertiesform"

interface T {
  collectionKey: string
  fieldId: string
  fieldDef: wire.GroupByField
  path: FullPath
  selectedPath: FullPath
}
const GroupByFieldPropTag: definition.UtilityComponent<T> = (props) => {
  const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
  const Text = component.getUtility("uesio/io.text")
  const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")
  const { fieldId, fieldDef, collectionKey, context, path, selectedPath } =
    props

  const collectionMetadata = api.collection.useCollection(
    context,
    collectionKey,
  )
  if (!collectionMetadata) return null
  const fieldMetadata = collectionMetadata.getField(fieldId)
  if (!fieldMetadata) return null

  const selected = path.equals(selectedPath)
  const hasSelectedChild = selectedPath.startsWith(path)
  const aggfunction = fieldDef?.function
  console.log(aggfunction)

  const nsInfo = getBuilderNamespace(context, fieldId as metadata.MetadataKey)

  return (
    <PropNodeTag
      draggable={`${collectionKey}:${fieldId}`}
      key={fieldId}
      selected={selected || hasSelectedChild}
      context={context}
      onClick={(e: MouseEvent) => {
        setSelectedPath(context, path)
        e.stopPropagation()
      }}
      popperChildren={
        <PropertiesForm
          id={path.combine()}
          path={path}
          context={context}
          title={"Aggregate Field Properties"}
          properties={[
            {
              type: "TEXT",
              name: "function",
            },
          ]}
          sections={[]}
        />
      }
    >
      <ItemTag context={context}>
        <NamespaceLabel
          context={context}
          metadatainfo={nsInfo}
          metadatakey={fieldId}
          title={fieldMetadata.getLabel()}
        />
        <div>
          <Text
            text={fieldMetadata.getType()}
            context={context}
            variant="uesio/builder.infobadge"
          />
        </div>
      </ItemTag>

      <IOExpandPanel context={context} expanded={selected}>
        <BuildActionsArea context={context}>
          <DeleteAction context={context} path={path} />
          <MoveActions context={context} path={path} />
        </BuildActionsArea>
      </IOExpandPanel>
    </PropNodeTag>
  )
}

export default GroupByFieldPropTag
