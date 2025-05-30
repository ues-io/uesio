import { ReactNode } from "react"
import { definition, metadata } from "@uesio/ui"

import ListMenu from "../listmenu/listmenu"
import IconButton from "../iconbutton/iconbutton"
import { Placement } from "@floating-ui/react"

interface MenuButtonUtilityProps<I> {
  itemRenderer: (item: I) => ReactNode
  onSelect?: (item: I) => void
  getItemKey: (item: I) => string
  buttonVariant?: metadata.MetadataKey
  icon?: string
  fill?: boolean
  items: I[]
  reference?: Element
  defaultPlacement?: Placement
  offset?: number
}

const MenuButton: definition.UtilityComponent<
  MenuButtonUtilityProps<unknown>
> = (props) => {
  const {
    context,
    icon,
    fill,
    items,
    itemRenderer,
    onSelect,
    getItemKey,
    className,
    buttonVariant,
    reference,
    defaultPlacement,
    classes,
    offset,
  } = props

  return (
    <ListMenu
      context={context}
      onSelect={onSelect}
      itemRenderer={itemRenderer}
      items={items}
      getItemKey={getItemKey}
      reference={reference}
      defaultPlacement={defaultPlacement}
      classes={classes}
      offset={offset}
    >
      <IconButton
        className={className}
        context={context}
        icon={icon}
        fill={fill}
        variant={buttonVariant}
      />
    </ListMenu>
  )
}

export type { MenuButtonUtilityProps }

export default MenuButton
