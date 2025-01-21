import { component, definition, metadata, api, styles } from "@uesio/ui"
import { getBuilderNamespace } from "../../api/stateapi"
import ItemTag from "../../utilities/itemtag/itemtag"

const WireTag: definition.UC = (props) => {
  const { context } = props
  const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")
  const IconLabel = component.getUtility("uesio/io.iconlabel")
  const Text = component.getUtility("uesio/io.text")
  const record = context.getRecord()
  const wireId = record?.getFieldValue<string>("key")
  const wire = api.wire.useWire(wireId, context)

  if (!record) return null

  const collection = record.getFieldValue<string>("value->collection")
  const viewOnly = record.getFieldValue<string>("value->viewOnly")

  const nsInfo = getBuilderNamespace(
    context,
    collection as metadata.MetadataKey,
  )

  const errors = wire
    ? wire.getErrorArray()?.map((error) => error.message) || []
    : ["Invalid Wire Definition"]

  const hasErrors = errors.length > 0

  return (
    <ItemTag context={context}>
      <IconLabel
        icon={hasErrors ? "error" : "check_circle"}
        fill={false}
        color={hasErrors ? "red" : "green"}
        tooltip={hasErrors ? errors.join(" ") : ""}
        text={wireId}
        context={context}
      />
      {viewOnly ? (
        <div>
          <Text
            text="VIEW ONLY"
            context={context}
            variant="uesio/builder.infobadge"
          />
        </div>
      ) : (
        <NamespaceLabel
          metadatainfo={nsInfo}
          context={context}
          metadatakey={collection}
          styleTokens={styles.getVariantTokens(
            "uesio/io.text",
            "uesio/builder.infobadge",
            context,
          )}
        />
      )}
    </ItemTag>
  )
}

export default WireTag
