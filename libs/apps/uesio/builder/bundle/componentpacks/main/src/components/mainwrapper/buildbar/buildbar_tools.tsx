import { definition, component, styles, api, hooks } from "@uesio/ui"
import { RefObject } from "react"
import { getBuilderState } from "../../../api/stateapi"

type ViewOption = {
  id: string
  label: string
}

type Props = {
  rootRef: RefObject<HTMLDivElement | null>
}

const SHADOWS = Object.freeze([
  "0 0px 3px 0 rgb(0 0 0 / 0.1)",
  "0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "0 4px 6px -1px rgb(0 0 0 / 0.1)",
])

const StyleDefaults = Object.freeze({
  toolbar: ["grid", "gap-1"],
  toolbarButton: [
    "px-1",
    "bg-slate-100",
    "rounded",
    "text-slate-600",
    "text-xs",
    "[max-width:1.65em]",
  ],
  menuitem: ["flex", "items-center", "gap-2"],
  menuitemlabel: ["text-sm"],
  menuitemicon: ["min-w-[14px]"],
  menu: [`shadow-[${SHADOWS.join(",").split(" ").join("_")}]`, "border-0"],
})

const TOOLTIP_OFFSET = 8

const BuildBarTools: definition.UtilityComponent<Props> = (props) => {
  const { context, rootRef } = props

  const IOButton = component.getUtility("uesio/io.button")
  const IOIcon = component.getUtility("uesio/io.icon")
  const MenuButton = component.getUtility("uesio/io.menubutton")

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const viewOptions: ViewOption[] = [
    {
      id: "code",
      label: "Code Panel",
    },
    {
      id: "index",
      label: "Index Panel",
    },
  ]

  const baseContext = context.removeViewFrame(1)

  const toggleCode = api.signal.getHandler(
    [
      {
        signal: "component/CALL",
        component: "uesio/builder.mainwrapper",
        componentsignal: "TOGGLE_CODE",
      },
    ],
    baseContext,
  )

  const toggleIndex = api.signal.getHandler(
    [
      {
        signal: "component/CALL",
        component: "uesio/builder.mainwrapper",
        componentsignal: "TOGGLE_INDEX",
      },
    ],
    baseContext,
  )

  hooks.useHotKeyCallback("meta+y", () => {
    toggleCode?.()
  })

  hooks.useHotKeyCallback("meta+i", () => {
    toggleIndex?.()
  })

  const isShowingCode = getBuilderState<boolean>(context, "codepanel")
  const isShowingIndex = getBuilderState<boolean>(context, "indexpanel")

  const selectedItems: string[] = []
  if (isShowingCode) {
    selectedItems.push("code")
  }
  if (isShowingIndex) {
    selectedItems.push("index")
  }

  return (
    <div className={classes.toolbar}>
      <MenuButton
        onSelect={(option: ViewOption) => {
          if (option.id === "index") toggleIndex?.()
          if (option.id === "code") toggleCode?.()
        }}
        getItemKey={(option: ViewOption) => option.id}
        itemRenderer={(option: ViewOption) => (
          <div className={classes.menuitem}>
            <IOIcon
              icon={selectedItems.includes(option.id) ? "check" : ""}
              context={context}
              className={classes.menuitemicon}
            />
            <div className={classes.menuitemlabel}>{option.label}</div>
          </div>
        )}
        context={context}
        items={viewOptions}
        icon="dashboard"
        className={classes.toolbarButton}
        reference={rootRef.current}
        defaultPlacement="top-end"
        classes={{
          menu: classes.menu,
        }}
        offset={TOOLTIP_OFFSET}
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

export { SHADOWS }
