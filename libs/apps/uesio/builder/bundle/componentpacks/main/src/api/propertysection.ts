import { definition } from "@uesio/ui"
import { ComponentProperty } from "../properties/componentproperty"

interface ListPropertyItemsDefinition {
	properties: ComponentProperty[]
	addLabel: string
	displayTemplate: string
	title?: string
	defaultDefinition?: definition.DefinitionMap
}

type PropertyPanelSectionType =
	| "HOME"
	| "DISPLAY"
	| "STYLES"
	| "SIGNALS"
	| "CUSTOM"
	| "LIST"

interface BaseSection {
	id?: string
	label?: string
	type?: PropertyPanelSectionType
	icon?: string
}

interface HomeSection extends BaseSection {
	id: "uesio.home"
	label: ""
	icon: "home"
	type: "HOME"
}

interface CustomSection extends BaseSection {
	label: string
	id?: string
	icon?: string
	viewDefinition: definition.DefinitionList
	type?: "CUSTOM"
}

interface CustomListSection extends BaseSection {
	label: string
	id?: string
	icon?: string
	type: "LIST"
	items: ListPropertyItemsDefinition
}

interface DisplaySection extends BaseSection {
	id: "uesio.display"
	label: "Display"
	type: "DISPLAY"
}

interface StylesSection extends BaseSection {
	id: "uesio.styles"
	label: "Styles"
	type: "STYLES"
}

interface SignalsSection extends BaseSection {
	type: "SIGNALS"
	id?: string
	label?: string
}

type PropertiesPanelSection =
	| HomeSection
	| SignalsSection
	| CustomSection
	| DisplaySection
	| StylesSection
	| CustomListSection

const HOME_SECTION: HomeSection = {
	id: "uesio.home",
	label: "",
	icon: "home",
	type: "HOME",
}
const STYLES_SECTION: StylesSection = {
	id: "uesio.styles",
	label: "Styles",
	type: "STYLES",
	icon: "",
}
const DISPLAY_SECTION: DisplaySection = {
	id: "uesio.display",
	label: "Display",
	type: "DISPLAY",
	icon: "",
}

const isStylesSection = (s: PropertiesPanelSection): s is StylesSection =>
	s.type === "STYLES"
const isDisplaySection = (s: PropertiesPanelSection): s is DisplaySection =>
	s.type === "DISPLAY"
const isCustomSection = (s: PropertiesPanelSection): s is CustomSection =>
	!s.type || s.type === "CUSTOM"

const getSectionId = (s: PropertiesPanelSection): string => {
	switch (s.type) {
		case "HOME":
			return HOME_SECTION.id
		case "STYLES":
			return STYLES_SECTION.id
		case "DISPLAY":
			return DISPLAY_SECTION.id
		case "SIGNALS":
			return s.id || "signals"
		default:
			return s.id || s.label || ""
	}
}

const getSectionLabel = (s: PropertiesPanelSection): string => {
	switch (s.type) {
		case "HOME":
			return HOME_SECTION.label
		case "STYLES":
			return STYLES_SECTION.label
		case "DISPLAY":
			return DISPLAY_SECTION.label
		case "SIGNALS":
			return s.label || "Signals"
		default:
			return s.label || s.id || ""
	}
}

const getSectionIcon = (s: PropertiesPanelSection): string => {
	switch (s.type) {
		case "HOME":
			return HOME_SECTION.icon
		default:
			return s.icon || ""
	}
}

export {
	HOME_SECTION,
	STYLES_SECTION,
	DISPLAY_SECTION,
	isCustomSection,
	isStylesSection,
	isDisplaySection,
	getSectionId,
	getSectionLabel,
	getSectionIcon,
	StylesSection,
	CustomSection,
	CustomListSection,
	HomeSection,
	DisplaySection,
	SignalsSection,
	PropertiesPanelSection,
	ListPropertyItemsDefinition,
}
