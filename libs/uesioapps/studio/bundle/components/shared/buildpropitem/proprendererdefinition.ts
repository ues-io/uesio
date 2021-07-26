import { definition, builder } from "@uesio/ui"
import { ValueAPI } from "../propertiespaneldefinition"

interface PropRendererProps extends definition.BaseProps {
	descriptor: builder.PropDescriptor
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: ValueAPI
}

export { PropRendererProps }
