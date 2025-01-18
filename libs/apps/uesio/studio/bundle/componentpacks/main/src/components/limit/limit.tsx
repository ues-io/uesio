import { api, component, definition, wire, styles } from "@uesio/ui"

type LimitDefinition = {
  title: string
  subtitle: string
  wire: string
  maximum: number
  recordDisplay?: component.DisplayCondition[]
}

const StyleDefaults = Object.freeze({
  root: ["mb-5", "p-5", "border-1", "border-black-500", "rounded-lg"],
})

const Limit: definition.UC<LimitDefinition> = (props) => {
  const { context, definition } = props
  const classes = styles.useStyleTokens(StyleDefaults, props)
  const Titlebar = component.getUtility("uesio/io.titlebar")
  const wire = api.wire.useWire(definition.wire, context)
  const maximum = Number(context.mergeString(definition.maximum))
  const itemContexts = component.useContextFilter<wire.WireRecord>(
    wire?.getData() || [],
    definition.recordDisplay,
    (record, context) => {
      if (record && wire) {
        context = context.addRecordFrame({
          wire: wire.getId(),
          record: record.getId(),
          view: wire.getViewId(),
        })
      }
      return context
    },
    context,
  )

  let total = 0
  const expression = "uesio/studio.total"
  itemContexts.forEach((record) => {
    total += (record.item.getFieldValue(expression) as number) || 0
  })

  return (
    <div className={classes.root}>
      <Titlebar
        context={context}
        title={definition.title}
        subtitle={definition.subtitle}
      />
      <progress value={total} max={maximum} />
      <h5>
        {total} of {maximum} included
      </h5>
    </div>
  )
}

export default Limit
