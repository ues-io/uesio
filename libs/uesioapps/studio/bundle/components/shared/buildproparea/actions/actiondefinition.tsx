import { definition, builder } from "@uesio/ui"

interface ActionProps extends definition.BaseProps {
	action?: builder.ActionDescriptor
	getValue: (path: string) => definition.Definition
}

export { ActionProps }
