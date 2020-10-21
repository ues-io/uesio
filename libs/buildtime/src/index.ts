import { component } from "@uesio/ui"
import Buildtime from "./components/buildtime"
import SlotBuilder from "./components/slot/slotbuilder"
import Wire from "./components/wire/wire"
import { WirePropertyDefinition } from "./components/wire/wiredefinition"

component.registry.registerBuilder("uesio", "runtime", Buildtime, null)
component.registry.registerBuilder("uesio", "slot", SlotBuilder, null)
component.registry.registerBuilder(
	"uesio",
	"wire",
	Wire,
	WirePropertyDefinition
)
