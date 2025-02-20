import { definition, component, styles } from "@uesio/ui"
import { setSelectedPath } from "../../api/stateapi"
import IndexComponent from "./indexcomponent"
import { standardAccepts } from "../../helpers/dragdrop"
import { usePlaceHolders } from "../../utilities/buildwrapper/buildwrapper"
import { FullPath } from "../../api/path"
import ActionButton from "../../helpers/actionbutton"
import { remove, set } from "../../api/defapi"

const StyleDefaults = Object.freeze({
  placeholder: [
    "bg-blue-600",
    "py-2",
    "px-3",
    "grid",
    "m-1",
    "rounded-sm",
    "items-center",
  ],
})

const IndexBuildWrapper: definition.UC = (props) => {
  const { children, path, context } = props

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
  const [addBefore, addAfter] = usePlaceHolders(context, path)

  return (
    <div className="contents" data-placeholder="true">
      {addBefore && (
        <div className={classes.placeholder} data-placeholder="true" />
      )}
      {children}
      {addAfter && (
        <div className={classes.placeholder} data-placeholder="true" />
      )}
    </div>
  )
}

type IndexSlotProps = {
  slot: component.SlotDef
  selectedPath: FullPath
  indent?: boolean
} & definition.BaseProps

const SlotStyleDefaults = Object.freeze({
  slot: ["grid", "border-transparent"],
  slotSelected: [
    "rounded-lg",
    "bg-index_selected_bg_color",
    "border-1",
    "border-index_selected_border_color",
    "ml-1",
    "mb-1",
    "overflow-hidden",
  ],
  slotIndent: ["ml-2"],
  slotHeader: ["flex", "p-1"],
  slotHeaderSelected: ["p-2", "bg-index_selected_header_bg_color"],
  slotTitle: [
    "uppercase",
    "text-index_slot_title_color",
    "font-light",
    "text-[7pt]",
    "grow",
    "p-0.5",
  ],
  slotContent: ["border-index_selected_divider_color"],
  slotContentSelected: ["p-1", "empty:hidden"],
  visibilityIcon: [
    "text-[8pt]",
    "text-index_visibility_button_color",
    "mr-1",
    "mt-0.5",
  ],
  actionarea: [
    "text-right",
    "text-index_action_button_color",
    "px-1",
    "border-b",
    "border-index_selected_header_border_color",
    "bg-index_selected_header_bg_color",
  ],
})

const IndexSlot: definition.UtilityComponent<IndexSlotProps> = (props) => {
  const IOIcon = component.getUtility("uesio/io.icon")
  const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
  const { context, slot, path, definition, indent, selectedPath } = props
  const listName = slot.name
  const label = slot.label || listName || "Slot"

  const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
  const classes = styles.useUtilityStyleTokens(SlotStyleDefaults, props)
  const slotPath = new FullPath("viewdef", context.getViewDefId(), listPath)
  const selected = selectedPath.equals(slotPath)

  if (!definition) return null

  const hasSlotNode = !!definition[listName]

  return (
    <div
      onClick={(e) => {
        setSelectedPath(context, slotPath)
        e.stopPropagation()
      }}
      className={styles.cx(
        indent && classes.slotIndent,
        classes.slot,
        selected && classes.slotSelected,
      )}
      data-accepts={standardAccepts.join(",")}
      data-path={component.path.toDataAttrPath(listPath)}
    >
      <div data-placeholder="true">
        <div
          className={styles.cx(
            classes.slotHeader,
            selected && classes.slotHeaderSelected,
          )}
        >
          <div className={classes.slotTitle}>{label}</div>
          {!hasSlotNode && selected && (
            <IOIcon
              className={classes.visibilityIcon}
              context={context}
              icon="visibility_off"
            />
          )}
        </div>
        <IOExpandPanel context={context} expanded={selected}>
          <div className={classes.actionarea}>
            <ActionButton
              title={hasSlotNode ? "Delete Contents" : "Activate"}
              onClick={() =>
                hasSlotNode
                  ? remove(context, slotPath)
                  : set(context, slotPath, [])
              }
              icon={hasSlotNode ? "delete" : "visibility"}
              context={context}
            />
          </div>
        </IOExpandPanel>
      </div>
      <div
        className={styles.cx(
          classes.slotContent,
          selected && classes.slotContentSelected,
        )}
      >
        {component
          .getSlotProps({
            listName,
            definition,
            path,
            context,
          })
          .map((props, index) => (
            <IndexBuildWrapper key={index} {...props}>
              <IndexComponent selectedPath={selectedPath} {...props} />
            </IndexBuildWrapper>
          ))}
      </div>
    </div>
  )
}

export default IndexSlot
