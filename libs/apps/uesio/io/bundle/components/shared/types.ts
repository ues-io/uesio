import { definition } from "@uesio/ui"

type HTMLElementAttributes = Record<string, string>

export type IOUtilityProps = {
	attributes?: HTMLElementAttributes
}

export interface BaseDefinition
	extends definition.BaseDefinition,
		IOUtilityProps {}
