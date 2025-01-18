import { useState } from "react"
import {
  definition,
  component,
  api,
  styles,
  metadata,
  context,
} from "@uesio/ui"

import groupBy from "lodash/groupBy"
import pickBy from "lodash/pickBy"
import {
  ComponentDef,
  getBuilderNamespace,
  getBuilderNamespaces,
  getComponentDef,
  getComponentDefs,
  getSelectedComponentOrSlotPath,
  getSelectedComponentPath,
  setSelectedPath,
  useSelectedPath,
} from "../../../api/stateapi"
import PropNodeTag from "../../../utilities/propnodetag/propnodetag"
import { FullPath } from "../../../api/path"
import SearchArea from "../../../helpers/searcharea"
import ItemTag from "../../../utilities/itemtag/itemtag"
import {
  getDragEndHandler,
  getDragStartHandler,
  addComponentToCanvas,
} from "../../../helpers/dragdrop"
import { get } from "../../../api/defapi"

const getUtility = component.getUtility

const findClosestSlot = (
  selectedPath: FullPath,
  context: context.Context,
): FullPath => {
  if (!selectedPath.isSet() || selectedPath.size() === 0) {
    return new FullPath(
      "viewdef",
      context.getViewDefId(),
      component.path.fromPath(["components", "0"]),
    )
  }
  const def = get(context, selectedPath)
  const trimmedPath = getSelectedComponentPath(selectedPath, def)
  const slotPath = getSelectedComponentOrSlotPath(selectedPath, def)
  const [componentType] = trimmedPath.pop()
  const componentDef = getComponentDef(componentType)

  // If we have a slotPath that is different than our component path
  // Then we likely have a slot selected. We can just insert into that slot.
  if (!slotPath.equals(trimmedPath)) {
    const [slotName] = slotPath.pop()
    if (componentDef?.slots?.find((slotDef) => slotDef.name === slotName)) {
      return slotPath.addLocal("0")
    }
  }

  // If that slot does not exist in the slot metadata
  // or it does not exist in the view definition,
  // try the next one up the tree.
  if (!componentDef?.slots?.[0] || !def) {
    const [, rest] = selectedPath.pop()
    return findClosestSlot(rest, context)
  }

  return trimmedPath.addLocal(componentDef.slots[0].name).addLocal("0")
}

const isSelected = (
  itemtype: string,
  itemname: metadata.MetadataKey,
  selectedPath: FullPath,
) => selectedPath.equals(new FullPath(itemtype, itemname))

const alphabetical = (a: ComponentDef, b: ComponentDef) => {
  if (!a.name) return 1
  if (!b.name) return -1
  return a.name.localeCompare(b.name)
}

type VariantsBlockProps = {
  variants: component.ComponentVariant[]
  selectedPath: FullPath
  component: ComponentDef
}

const VariantsBlockStyleDefaults = Object.freeze({
  root: ["m-2", "flex", "flex-wrap", "gap-2"],
})

const VariantsBlock: definition.UtilityComponent<VariantsBlockProps> = (
  props,
) => {
  const { component: componentDef, context, variants, selectedPath } = props
  const classes = styles.useUtilityStyleTokens(
    VariantsBlockStyleDefaults,
    props,
  )
  const NamespaceLabel = getUtility("uesio/io.namespacelabel")

  return (
    <div className={classes.root}>
      {variants.map((variant) => {
        const variantKey = api.component.getVariantId(variant)

        const nsInfo = getBuilderNamespace(
          context,
          variant.namespace as metadata.MetadataKey,
        )

        return (
          <PropNodeTag
            key={variantKey}
            // onClick={(e: MouseEvent) => {
            // 	e.stopPropagation()
            // 	setSelectedPath(
            // 		context,
            // 		new FullPath("componentvariant", variantKey)
            // 	)
            // }}
            onDoubleClick={(e) => {
              // Have to stop propagation to prevent the Component's onDoubleClick
              // from running as well
              e.stopPropagation()
              addComponentToCanvas(
                context,
                `${componentDef.namespace}.${componentDef.name}`,
                findClosestSlot(selectedPath, context),
                {
                  [component.STYLE_VARIANT]: metadata.getKey(variant),
                },
              )
            }}
            selected={isSelected("componentvariant", variantKey, selectedPath)}
            draggable={`componentvariant:${variantKey}`}
            context={context}
            variant="uesio/builder.smallpropnodetag"
          >
            <NamespaceLabel
              metadatakey={variant.namespace}
              metadatainfo={nsInfo}
              title={variant.name}
              icon={componentDef.icon}
              context={context}
            />
          </PropNodeTag>
        )
      })}
    </div>
  )
}

type ComponentBlockProps = {
  componentDef: ComponentDef
  variants: component.ComponentVariant[]
  selectedPath: FullPath
}

const ComponentBlock: definition.UtilityComponent<ComponentBlockProps> = (
  props,
) => {
  const IOExpandPanel = getUtility("uesio/io.expandpanel")
  const { context, componentDef, variants, selectedPath } = props
  const { namespace, name } = componentDef
  if (!namespace) throw new Error("Invalid Property Definition")
  const fullName = `${namespace}.${name}` as metadata.MetadataKey

  const allNSInfo = getBuilderNamespaces(context)

  // Filter out variants that aren't in one of our namespaces
  // (this is for filtering out variants from the studio namespace)
  const validVariants = variants?.filter(
    (variant) => !!allNSInfo[variant.namespace],
  )

  return (
    <PropNodeTag
      context={context}
      key={fullName}
      onDoubleClick={() => {
        addComponentToCanvas(
          context,
          fullName,
          findClosestSlot(selectedPath, context),
        )
      }}
      draggable={`component:${fullName}`}
      selected={isSelected("component", fullName, selectedPath)}
    >
      <ComponentTag
        componentDef={componentDef}
        context={context}
        selectedPath={selectedPath}
      />
      <IOExpandPanel
        context={context}
        expanded={isSelected("component", fullName, selectedPath)}
      >
        {validVariants && validVariants.length > 0 && (
          <VariantsBlock
            selectedPath={selectedPath}
            variants={validVariants}
            context={context}
            component={componentDef}
          />
        )}
      </IOExpandPanel>
    </PropNodeTag>
  )
}

type CategoryBlockProps = {
  components: ComponentDef[]
  variants: Record<string, component.ComponentVariant[]>
  selectedPath: FullPath
  category: string
}

const CategoryBlockStyleDefaults = Object.freeze({
  categoryLabel: [
    "mx-2",
    "mt-4",
    "-mb-1",
    "text-xs",
    "font-light",
    "text-slate-500",
  ],
})

const CategoryBlock: definition.UtilityComponent<CategoryBlockProps> = (
  props,
) => {
  const classes = styles.useUtilityStyleTokens(
    CategoryBlockStyleDefaults,
    props,
  )
  const { context, components, category, variants, selectedPath } = props
  const comps = components
  if (!comps || !comps.length) return null
  comps.sort(alphabetical)
  return (
    <>
      <div className={classes.categoryLabel}>{category}</div>
      {comps.map((component) => {
        const { namespace, name } = component
        if (!namespace) throw new Error("Invalid Property Definition")
        const fullName = `${namespace}.${name}`
        return (
          <ComponentBlock
            key={fullName}
            variants={variants[fullName]}
            componentDef={component}
            context={context}
            selectedPath={selectedPath}
          />
        )
      })}
    </>
  )
}

type ComponentTagProps = {
  componentDef: ComponentDef
  selectedPath: FullPath
}

const ComponentTag: definition.UtilityComponent<ComponentTagProps> = (
  props,
) => {
  const { context, componentDef, selectedPath } = props
  const { namespace, name, icon, title, description } = componentDef
  if (!namespace) throw new Error("Invalid Property Definition")
  const fullName = `${namespace}.${name}` as metadata.MetadataKey
  const NamespaceLabel = getUtility("uesio/io.namespacelabel")
  const IconButton = getUtility("uesio/io.iconbutton")
  const Group = getUtility("uesio/io.group")

  const nsInfo = getBuilderNamespace(context, namespace)

  return (
    <ItemTag description={description} context={context}>
      <NamespaceLabel
        metadatakey={namespace}
        metadatainfo={nsInfo}
        title={title || name}
        context={context}
        icon={icon}
      />
      <Group context={context}>
        <IconButton
          icon="info"
          variant="uesio/builder.hoveraction"
          label="Component Info"
          onClick={(e: MouseEvent) => {
            // Only run once on a double-click
            if (e.detail > 1) return
            setSelectedPath(context, new FullPath("component", fullName))
          }}
          tooltipPlacement="bottom"
          tooltipOffset={10}
          context={context}
        />
        <IconButton
          icon="tab_move"
          variant="uesio/builder.hoveraction"
          label="Add to Canvas"
          onClick={(e: MouseEvent) => {
            // Only run once on a double-click
            if (e.detail > 1) return
            addComponentToCanvas(
              context,
              fullName,
              findClosestSlot(selectedPath, context),
            )
          }}
          tooltipPlacement="bottom"
          tooltipOffset={10}
          context={context}
        />
      </Group>
    </ItemTag>
  )
}

const ComponentsPanel: definition.UC = (props) => {
  const ScrollPanel = getUtility("uesio/io.scrollpanel")
  const { context } = props

  const [searchTerm, setSearchTerm] = useState("")
  const searchTermLC = searchTerm?.toLowerCase()
  const components = pickBy(
    getComponentDefs(),
    (component) =>
      component.discoverable &&
      (component.name?.toLowerCase().includes(searchTermLC) ||
        component.description?.toLowerCase().includes(searchTermLC) ||
        component.category?.toLowerCase().includes(searchTermLC)),
  )

  const selectedPath = useSelectedPath(context)

  const categoryOrder = [
    "LAYOUT",
    "CONTENT",
    "DATA",
    "INTERACTION",
    "VISUALIZATION",
    "UNCATEGORIZED",
  ]

  // sort the variants by category
  const componentsByCategory = groupBy(
    Object.values(components || {}),
    (component) => component.category || "UNCATEGORIZED",
  )

  const variants = api.component.useAllVariants()
  const variantsByComponent = groupBy(variants, (variant) => variant.component)

  return (
    <ScrollPanel
      header={
        <SearchArea
          id="builder-components-search"
          searchTerm={searchTerm}
          context={context}
          setSearchTerm={setSearchTerm}
        />
      }
      context={context}
    >
      <div
        onDragStart={getDragStartHandler(context)}
        onDragEnd={getDragEndHandler(context)}
      >
        {categoryOrder.map((category) => (
          <CategoryBlock
            key={category}
            variants={variantsByComponent}
            components={componentsByCategory[category]}
            category={category}
            selectedPath={selectedPath}
            context={context}
          />
        ))}
      </div>
    </ScrollPanel>
  )
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
