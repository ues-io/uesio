import type { DefinitionList } from "./definition"
import type { WireDefinitionMap } from "./wire"
import type { PanelDefinitionMap } from "./panel"
import type { ViewParamDefinition } from "./param"
import type { ViewEventsDef } from "./view"
import { SlotDef } from "./component"

export type ViewDefinition = {
	components: DefinitionList | null
	wires?: WireDefinitionMap | null
	panels?: PanelDefinitionMap | null
	events?: ViewEventsDef
	params?: Record<string, ViewParamDefinition> | null
	slots?: SlotDef[] | null
}
