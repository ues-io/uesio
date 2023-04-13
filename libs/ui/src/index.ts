import View from "./components/view"

// For use in exports as the uesio api
import * as collection from "./collectionexports"
import * as component from "./componentexports"
import * as context from "./context/context"
import * as definition from "./definition/definition"
import * as hooks from "./hooks/hooks"
import * as api from "./api/api"
import loader from "./loader/loader"
import * as signal from "./signalexports"
import * as styles from "./styles/styles"
import * as util from "./utilexports"
import * as wire from "./wireexports"
import * as platform from "./platform/platform"
import * as metadata from "./metadataexports"
import * as notification from "./notificationexports"
import * as param from "./paramexports"
import { register } from "./component/registry"

// Register with the component registry so that it's not an explicit dependency
register("uesio/core.view", View)

export {
	api,
	collection,
	component,
	context,
	definition,
	hooks,
	loader,
	metadata,
	notification,
	param,
	platform,
	signal,
	styles,
	util,
	wire,
}
