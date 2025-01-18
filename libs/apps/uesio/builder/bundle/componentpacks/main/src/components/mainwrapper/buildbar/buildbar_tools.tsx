import { definition, component, styles } from "@uesio/ui"

const StyleDefaults = Object.freeze({
  toolbar: ["grid", "gap-1"],
  toolbarButton: [
    "px-1",
    "bg-slate-100",
    "rounded",
    "text-slate-600",
    "text-xs",
  ],
})

const TOOLTIP_OFFSET = 8

const BuildBarTools: definition.UtilityComponent = (props) => {
  const { context } = props

  const IOButton = component.getUtility("uesio/io.button")

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  return (
    <div className={classes.toolbar}>
      <IOButton
        tooltip="Manage Builder Panels"
        tooltipPlacement="left"
        tooltipOffset={TOOLTIP_OFFSET}
        iconText="dashboard"
        classes={{ root: classes.toolbarButton }}
        context={context}
      />
      <IOButton
        tooltip="Set Device Size"
        tooltipPlacement="left"
        tooltipOffset={TOOLTIP_OFFSET}
        iconText="devices"
        classes={{ root: classes.toolbarButton }}
        context={context}
      />
      <IOButton
        tooltip="Collapse Build Bar"
        tooltipPlacement="left"
        tooltipOffset={TOOLTIP_OFFSET}
        iconText="right_panel_close"
        classes={{ root: classes.toolbarButton }}
        context={context}
      />
    </div>
  )
}

export default BuildBarTools
