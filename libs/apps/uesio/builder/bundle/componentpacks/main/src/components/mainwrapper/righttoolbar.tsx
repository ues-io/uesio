import { definition, component, styles, hooks, api } from "@uesio/ui"
import DeviceSizer from "./devicesizer"

// Yes, navigator.platform is deprecated, but according to MDN in 2023
// it's still the least bad way to detect what meta key means
// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples
export const metaKey =
  navigator.platform.indexOf("Mac") === 0 || navigator.platform === "iPhone"
    ? "⌘" // Command
    : "^" // Ctrl

const StyleDefaults = Object.freeze({
  root: [
    "grid",
    "gap-4",
    "grid-flow-col",
    "auto-cols-min",
    "absolute",
    "bottom-2.5",
    "right-14",
  ],
  panel: ["grid", "justify-center", "grid-flow-col"],
})

const RightToolbar: definition.UtilityComponent = (props) => {
  const { context } = props
  const Button = component.getUtility("uesio/io.button")
  const Icon = component.getUtility("uesio/io.icon")

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const toggleCode = api.signal.getHandler(
    [
      {
        signal: "component/CALL",
        component: "uesio/builder.mainwrapper",
        componentsignal: "TOGGLE_CODE",
      },
    ],
    context,
  )

  const toggleIndex = api.signal.getHandler(
    [
      {
        signal: "component/CALL",
        component: "uesio/builder.mainwrapper",
        componentsignal: "TOGGLE_INDEX",
      },
    ],
    context,
  )

  hooks.useHotKeyCallback("y", () => {
    toggleCode?.()
  })

  hooks.useHotKeyCallback("i", () => {
    toggleIndex?.()
  })

  return (
    <div className={classes.root}>
      <div className={classes.panel}>
        <Button
          context={context}
          label=""
          icon={<Icon context={context} fill={false} icon="account_tree" />}
          variant="uesio/builder.minoricontoolbar"
          onClick={toggleIndex}
          tooltip={`Toggle Index Panel (${metaKey} + I)`}
          tooltipPlacement="left"
        />
        <Button
          context={context}
          label=""
          icon={<Icon context={context} icon="code" />}
          variant="uesio/builder.minoricontoolbar"
          onClick={toggleCode}
          tooltip={`Toggle Code Panel (${metaKey} + Y)`}
          tooltipPlacement="left"
        />
      </div>
      <div className={classes.panel}>
        <DeviceSizer context={context} />
      </div>
    </div>
  )
}

export default RightToolbar
