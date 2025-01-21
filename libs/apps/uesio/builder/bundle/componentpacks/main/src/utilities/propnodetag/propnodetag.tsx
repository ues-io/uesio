import { ReactNode, useState } from "react"
import { component, styles, definition } from "@uesio/ui"

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
  const Popper = component.getUtility("uesio/io.popper")
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
        <Popper
          referenceEl={anchorEl}
          offset={8}
          context={context}
          placement="right-start"
          autoPlacement={["right-start"]}
          parentSelector="#propertieswrapper"
          styleTokens={{
            popper: ["h-full"],
          }}
          portalId="builder-root"
        >
          {popperChildren}
        </Popper>
      )}
      {props.children}
    </Tile>
  )
}

PropNodeTag.displayName = "PropNodeTag"

export default PropNodeTag
