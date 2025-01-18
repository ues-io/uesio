import { component, definition, wire, api, metadata } from "@uesio/ui"

import { useState } from "react"
import DeleteAction from "../../../../actions/deleteaction"
import MoveActions from "../../../../actions/moveactions"
import { FullPath } from "../../../../api/path"
import { getBuilderNamespace, setSelectedPath } from "../../../../api/stateapi"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"
import ItemTag from "../../../../utilities/itemtag/itemtag"

interface T {
  collectionKey: string
  fieldId: string
  fieldDef: wire.WireFieldDefinition
  path: FullPath
  selectedPath: FullPath
}
const FieldPropTag: definition.UtilityComponent<T> = (props) => {
  const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
  const Text = component.getUtility("uesio/io.text")
  const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")
  const { fieldId, fieldDef, collectionKey, context, path, selectedPath } =
    props

  const [expanded, setExpanded] = useState<boolean>(false)
  const collectionMetadata = api.collection.useCollection(
    context,
    collectionKey,
  )
  if (!collectionMetadata) return null
  const fieldMetadata = collectionMetadata.getField(fieldId)
  if (!fieldMetadata) return null

  const selected = path.equals(selectedPath)
  const hasSelectedChild = selectedPath.startsWith(path)
  const subFields = Object.keys(fieldDef?.fields || {})

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
    >
      <ItemTag context={context}>
        <NamespaceLabel
          context={context}
          metadatainfo={nsInfo}
          metadatakey={fieldId}
          title={fieldMetadata.getLabel()}
        />
        <div>
          {subFields && subFields.length > 0 && (
            <span
              onClick={(e) => {
                setExpanded(!expanded)
                e.stopPropagation()
              }}
            >
              <Text
                text={subFields.length + ""}
                context={context}
                variant="uesio/builder.infobadge"
              />
            </span>
          )}
          <Text
            text={fieldMetadata.getType()}
            context={context}
            variant="uesio/builder.infobadge"
          />
        </div>
      </ItemTag>
      {subFields && subFields.length > 0 && (
        <IOExpandPanel
          context={context}
          expanded={expanded || hasSelectedChild}
        >
          <div>
            {subFields.map((fieldId) => {
              const subFieldsPath = path.addLocal("fields")
              const referenceMetadata = fieldMetadata.getReferenceMetadata()
              if (!referenceMetadata) return null
              return (
                <FieldPropTag
                  collectionKey={referenceMetadata.collection}
                  fieldId={fieldId}
                  path={subFieldsPath.addLocal(fieldId)}
                  selectedPath={selectedPath}
                  fieldDef={fieldDef?.fields?.[fieldId]}
                  context={context}
                  key={fieldId}
                />
              )
            })}
          </div>
        </IOExpandPanel>
      )}
      <IOExpandPanel context={context} expanded={selected}>
        <BuildActionsArea context={context}>
          <DeleteAction context={context} path={path} />
          <MoveActions context={context} path={path} />
        </BuildActionsArea>
      </IOExpandPanel>
    </PropNodeTag>
  )
}

export default FieldPropTag
