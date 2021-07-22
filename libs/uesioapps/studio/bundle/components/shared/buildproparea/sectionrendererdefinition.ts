import { definition, builder } from "@uesio/ui"
import { ValueAPI } from "../propertiespaneldefinition"

interface SectionRendererProps extends definition.BaseProps {
	section: builder.PropertySection
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: ValueAPI
}

export { SectionRendererProps }
