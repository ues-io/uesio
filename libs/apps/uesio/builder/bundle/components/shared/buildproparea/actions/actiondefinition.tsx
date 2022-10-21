import { definition, builder } from "@uesio/ui"

interface ActionProps<T = builder.ActionDescriptor>
	extends definition.BaseProps {
	action?: T
	valueAPI: builder.ValueAPI
	propsDef?: builder.BuildPropertiesDefinition
}

export { ActionProps }
