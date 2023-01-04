import View from "./components/view/view"

// For use in exports as the uesio api
import * as builder from "./buildmode/buildpropdefinition"
import * as collection from "./collectionexports"
import * as component from "./componentexports"
import * as context from "./context/context"
import * as definition from "./definition/definition"
import * as hooks from "./hooks/hooks"
import loader from "./loader/loader"
import * as signal from "./signalexports"
import * as state from "./stateexports"
import * as styles from "./styles/styles"
import * as util from "./utilexports"
import * as wire from "./wireexports"
import * as platform from "./platform/platform"
import * as metadata from "./metadataexports"
import * as notification from "./notificationexports"
import * as panel from "./panelexports"
import * as param from "./paramexports"
import { materialIcons } from "./materialiconsexports"
import { register } from "./component/registry"

// Register with the component registry so that it's not an explicit dependency
register("uesio/core.view", View)

export {
	builder,
	collection,
	component,
	context,
	definition,
	hooks,
	loader,
	metadata,
	notification,
	panel,
	param,
	platform,
	signal,
	state,
	styles,
	util,
	wire,
	materialIcons,
}
