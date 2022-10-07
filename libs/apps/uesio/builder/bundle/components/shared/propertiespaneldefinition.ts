import { definition, builder } from "@uesio/ui"

interface PropertiesPaneProps extends definition.UtilityProps {
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: builder.ValueAPI
}

export { PropertiesPaneProps }
