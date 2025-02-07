import { definition, component, context, wire } from "@uesio/ui"
import { useState, useRef } from "react"
import { get, remove, set } from "../../../../api/defapi"
import { useSelectedPath } from "../../../../api/stateapi"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import FieldPropTag from "./fieldproptag"
import ViewOnlyFieldPropTag from "./viewonlyfieldproptag"
import FieldPicker from "./fieldpicker"
import { FullPath } from "../../../../api/path"
import AggregateFieldPropTag from "./aggregatefieldproptag"
import GroupByFieldPropTag from "./groupbyfieldproptag"
import PopoutPanel from "../popoutpanel"

type FieldsPropertiesDefinition = {
  viewOnly?: boolean
  aggregate?: boolean
  groupBy?: boolean
}

const FieldsProperties: definition.UC<FieldsPropertiesDefinition> = (props) => {
  const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
  const Icon = component.getUtility("uesio/io.icon")
  const Button = component.getUtility("uesio/io.button")
  const { context, definition } = props
  const { viewOnly, aggregate, groupBy } = definition
  const isViewOnlyWire = viewOnly
  const anchorEl = useRef<HTMLDivElement>(null)
  const [showPopper, setShowPopper] = useState(false)

  const selectedPath = useSelectedPath(context)
  if (selectedPath.size() < 2) return null
  const wirePath = selectedPath.trimToSize(2)
  const fieldsPath = wirePath.addLocal(groupBy ? "groupby" : "fields")
  const onSelect = (ctx: context.Context, path: FullPath) =>
    set(ctx, fieldsPath.merge(path), {})
  const onUnselect = (ctx: context.Context, path: FullPath) =>
    remove(ctx, fieldsPath.merge(path))
  const isSelected = (
    ctx: context.Context,
    path: FullPath,
    fieldId: string,
  ) => {
    const joinedPath = fieldsPath.merge(path).addLocal(fieldId)
    const wireField = get(ctx, joinedPath) as wire.WireFieldDefinitionMap
    return wireField !== undefined
  }

  const wireDef = get(context, wirePath) as wire.WireDefinition
  if (!wireDef) return null
  const collection = (wireDef && !wireDef.viewOnly && wireDef.collection) || ""

  const fields = groupBy && wireDef.aggregate ? wireDef.groupby : wireDef.fields

  return (
    <>
      {showPopper && anchorEl && (
        <PopoutPanel referenceEl={anchorEl.current} context={context}>
          <FieldPicker
            context={context}
            baseCollectionKey={collection}
            onClose={() => setShowPopper(false)}
            onSelect={onSelect}
            onUnselect={onUnselect}
            allowMultiselect={true}
            isSelected={isSelected}
          />
        </PopoutPanel>
      )}
      <ScrollPanel
        ref={anchorEl}
        context={context}
        footer={
          <BuildActionsArea justify="space-around" context={context}>
            {!viewOnly && (
              <Button
                context={context}
                variant="uesio/builder.panelactionbutton"
                icon={
                  <Icon
                    context={context}
                    icon="add"
                    variant="uesio/builder.actionicon"
                  />
                }
                label={"Collection Fields"}
                onClick={() => {
                  setShowPopper(true)
                }}
              />
            )}
            {!(aggregate || groupBy) && (
              <Button
                context={context}
                variant="uesio/builder.panelactionbutton"
                icon={
                  <Icon
                    context={context}
                    icon="add"
                    variant="uesio/builder.actionicon"
                  />
                }
                label={"View-only Field"}
                onClick={() => {
                  set(
                    context,
                    fieldsPath.addLocal(
                      "field" + (Math.floor(Math.random() * 60) + 1),
                    ),
                    isViewOnlyWire
                      ? {
                          type: "TEXT",
                        }
                      : { viewOnly: true, type: "TEXT" },
                    true,
                  )
                }}
              />
            )}
          </BuildActionsArea>
        }
      >
        {Object.entries(fields || {}).map(([fieldId, fieldDef]) => {
          const viewOnlyField =
            isViewOnlyWire || (fieldDef && "viewOnly" in fieldDef) || false

          if (viewOnlyField) {
            return (
              <ViewOnlyFieldPropTag
                fieldId={fieldId}
                key={fieldId}
                path={fieldsPath.addLocal(fieldId)}
                selectedPath={selectedPath}
                fieldDef={fieldDef as wire.ViewOnlyField}
                context={context}
              />
            )
          }

          if (groupBy) {
            return (
              <GroupByFieldPropTag
                collectionKey={collection}
                fieldId={fieldId}
                key={fieldId}
                path={fieldsPath.addLocal(fieldId)}
                selectedPath={selectedPath}
                fieldDef={fieldDef as wire.GroupByField}
                context={context}
              />
            )
          }

          if (aggregate) {
            return (
              <AggregateFieldPropTag
                collectionKey={collection}
                fieldId={fieldId}
                key={fieldId}
                path={fieldsPath.addLocal(fieldId)}
                selectedPath={selectedPath}
                fieldDef={fieldDef as wire.AggregateField}
                context={context}
              />
            )
          }

          return (
            <FieldPropTag
              collectionKey={collection}
              fieldId={fieldId}
              key={fieldId}
              path={fieldsPath.addLocal(fieldId)}
              selectedPath={selectedPath}
              fieldDef={fieldDef}
              context={context}
            />
          )
        })}
      </ScrollPanel>
    </>
  )
}

FieldsProperties.displayName = "FieldsProperties"

export default FieldsProperties
