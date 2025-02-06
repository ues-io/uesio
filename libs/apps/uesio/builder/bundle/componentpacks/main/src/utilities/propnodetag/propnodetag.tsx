import { ReactNode, useState } from "react"
import { component, styles, definition } from "@uesio/ui"
import PopoutPanel from "../../components/mainwrapper/propertiespanel/popoutpanel"

type Props = {
  selected?: boolean
  onClick?: (e: MouseEvent) => void
  onDoubleClick?: (e: MouseEvent) => void
  draggable?: string
  popperChildren?: ReactNode
}

const StyleDefaults = Object.freeze({
  draggable: ["cursor-grab"],
})

const PropNodeTag: definition.UtilityComponent<Props> = (props) => {
  const Tile = component.getUtility("uesio/io.tile")
  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
  const {
    onClick,
    onDoubleClick,
    draggable,
    selected,
    context,
    popperChildren,
    variant,
  } = props
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

  return (
    <Tile
      ref={setAnchorEl}
      rootAttributes={{
        draggable: !!draggable,
        "data-type": draggable,
      }}
      variant={variant || "uesio/builder.propnodetag"}
      context={context}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      isSelected={selected}
      className={styles.cx(
        selected && "selected",
        draggable && classes.draggable,
      )}
    >
      {selected && popperChildren && (
        <PopoutPanel referenceEl={anchorEl} context={context}>
          {popperChildren}
        </PopoutPanel>
      )}
      {props.children}
    </Tile>
  )
}

PropNodeTag.displayName = "PropNodeTag"

export default PropNodeTag
