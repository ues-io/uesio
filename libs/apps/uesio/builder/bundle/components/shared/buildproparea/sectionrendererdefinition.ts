import { definition, builder } from "@uesio/ui"

interface SectionRendererProps extends definition.BaseProps {
	section: builder.PropertySection
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: builder.ValueAPI
}

export { SectionRendererProps }
