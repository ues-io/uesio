import { definition, builder } from "@uesio/ui"

interface SectionRendererProps extends definition.BaseProps {
	section: builder.PropertySection
	definition: definition.DefinitionMap
}

export { SectionRendererProps }
