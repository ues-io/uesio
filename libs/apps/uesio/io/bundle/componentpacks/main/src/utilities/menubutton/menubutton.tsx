import { ReactNode } from "react"
import { definition, metadata } from "@uesio/ui"

import ListMenu from "../listmenu/listmenu"
import IconButton from "../iconbutton/iconbutton"

interface MenuButtonUtilityProps<I> {
  itemRenderer: (item: I) => ReactNode
  onSelect?: (item: I) => void
  getItemKey: (item: I) => string
  buttonVariant?: metadata.MetadataKey
  icon?: string
  fill?: boolean
  items: I[]
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
  } = props

  return (
    <ListMenu
      context={context}
      onSelect={onSelect}
      itemRenderer={itemRenderer}
      items={items}
      getItemKey={getItemKey}
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
