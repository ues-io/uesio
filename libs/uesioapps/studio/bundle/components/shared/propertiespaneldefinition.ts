import { definition, builder } from "@uesio/ui"

interface PropertiesPaneProps extends definition.UtilityProps {
	propsDef?: builder.BuildPropertiesDefinition | undefined
	valueAPI: builder.ValueAPI
}

export { PropertiesPaneProps }
