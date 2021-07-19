import { definition, builder } from "@uesio/ui"

interface SectionRendererProps extends definition.BaseProps {
	section: builder.PropertySection
	propsDef: builder.BuildPropertiesDefinition
	setValue: (path: string, value: definition.DefinitionValue) => void
	getValue: (path: string) => definition.Definition
}

export { SectionRendererProps }
