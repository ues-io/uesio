import { component, context, definition, wire } from "@uesio/ui"

import { useState } from "react"

import { FullPath } from "../api/path"
import {
  ComponentProperty,
  getStyleVariantProperty,
  StructProperty,
} from "../properties/componentproperty"
import PropertiesWrapper, {
  Tab,
} from "../components/mainwrapper/propertiespanel/propertieswrapper"
import {
  CustomSection,
  getSectionIcon,
  getSectionId,
  getSectionLabel,
  HomeSection,
  PropertiesPanelSection,
  StylesSection,
} from "../api/propertysection"
import { setSelectedPath } from "../api/stateapi"
import { getDisplaySectionProperties } from "../properties/displayconditionproperties"
import PropFormInternal, { getFormFields } from "./propforminternal"
import { getSignalProperties } from "../api/signalsapi"

type Props = {
  properties?: ComponentProperty[]
  content?: definition.DefinitionList
  path: FullPath
  title?: string
  sections?: PropertiesPanelSection[]
}

const PATH_ARROW = "->"

function getPropertyTabForSection(section: PropertiesPanelSection): Tab {
  return {
    id: getSectionId(section),
    label: getSectionLabel(section),
    icon: getSectionIcon(section),
  }
}

const findProperty = (
  propertyNameParts: string[],
  properties: ComponentProperty[],
): ComponentProperty | undefined => {
  const propertyName = propertyNameParts.shift()
  if (propertyNameParts.length === 0) {
    return properties.find((p) => p.name === propertyName)
  } else {
    // Find a property of type STRUCT whose name matches the first part of the property name
    const structProperty = properties.find(
      (p) => p.name === propertyName && p.type === "STRUCT",
    )
    if (!structProperty) return undefined
    return findProperty(
      propertyNameParts,
      (structProperty as StructProperty).properties,
    )
  }
}

const getProperty = (
  propertyId: string,
  properties: ComponentProperty[],
): ComponentProperty | undefined => {
  const nameParts = propertyId.split(PATH_ARROW)
  const isNestedProperty = nameParts.length > 1
  const propertyMatch = findProperty(nameParts, properties)
  if (propertyMatch && isNestedProperty) {
    // If this is a nested field, then we need to use the fully-qualified field name for the property name,
    // but if not, we can just use the original property object
    return {
      ...propertyMatch,
      name: propertyId,
    } as ComponentProperty
  }
  return propertyMatch
}

function getPropertiesForSection(
  section: CustomSection | HomeSection | StylesSection,
  properties: ComponentProperty[],
): ComponentProperty[] {
  if (section.properties?.length) {
    const matchingProperties = []
    for (const propertyId of section.properties) {
      const propertyMatch = getProperty(propertyId, properties)
      if (propertyMatch) {
        matchingProperties.push(propertyMatch)
      }
    }
    return matchingProperties
  } else {
    return properties
  }
}

const getPropertiesAndContent = (props: Props, selectedTab: string) => {
  let { content, properties } = props
  const { path, sections } = props

  if (sections && sections.length) {
    const selectedSection =
      sections.find((section) => selectedTab === getSectionId(section)) ||
      sections[0]
    const selectedSectionId = getSectionId(selectedSection)

    switch (selectedSection?.type) {
      case "DISPLAY": {
        properties = getDisplaySectionProperties(selectedSectionId)
        break
      }
      case "STYLES": {
        properties = [
          getStyleVariantProperty(selectedSection.componentType),
          ...(properties && selectedSection?.properties?.length
            ? getPropertiesForSection(selectedSection, properties)
            : []),
        ]
        content = [
          ...getFormFields(properties, path),
          {
            "uesio/builder.stylesproperty": {
              componentType: selectedSection.componentType,
              componentPath: path,
            },
          },
        ]
        break
      }
      case "SIGNALS": {
        properties = [
          {
            name: selectedSectionId,
            type: "LIST",
            items: {
              properties: (
                record: wire.PlainWireRecord,
                context: context.Context,
              ) => getSignalProperties(record, context),
              displayTemplate: "${signal}",
              addLabel: "New Signal",
              title: "Signal Properties",
              defaultDefinition: {
                signal: "",
              },
            },
          },
        ]
        break
      }
      case "CUSTOM":
      case "HOME":
        if (selectedSection?.type === "CUSTOM") {
          content = selectedSection?.viewDefinition
        }
        if (properties && selectedSection?.properties?.length) {
          properties = getPropertiesForSection(selectedSection, properties)
        }
        break
    }
  }

  return {
    content,
    properties,
  }
}

const PropertiesForm: definition.UtilityComponent<Props> = (props) => {
  const { path, sections = [], title, id = title, context } = props

  const [selectedTab, setSelectedTab] = useState<string>(
    sections && sections.length ? getSectionId(sections[0]) : "",
  )
  const { content, properties } = getPropertiesAndContent(props, selectedTab)

  const propSections = component
    .useShouldFilter(sections, context)
    ?.map((section) => getPropertyTabForSection(section))

  return (
    <PropertiesWrapper
      context={context}
      className={props.className}
      path={path}
      title={title}
      onUnselect={() => setSelectedPath(context)}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      tabs={propSections}
    >
      <PropFormInternal
        context={context}
        properties={properties}
        content={content}
        id={id}
        path={path}
      />
    </PropertiesWrapper>
  )
}

export default PropertiesForm
