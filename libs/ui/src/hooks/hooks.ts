import { SignalAPI } from "./signalapi"
import { WireAPI } from "./wireapi"
import { BuilderAPI } from "./builderapi"
import { ViewAPI } from "./viewapi"
import { FileAPI } from "./fileapi"
import { ComponentAPI } from "./componentapi"
import { PlatformAPI } from "./platformapi"
import { CollectionAPI } from "./collectionapi"
import { BaseProps } from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import { ConfigValueAPI } from "./configvalueapi"
import { SecretAPI } from "./secretapi"
import { ThemeAPI } from "./themeapi"
import { NotificationAPI } from "./notificationapi"
import { FeatureFlagAPI } from "./featureflagapi"
import { BotAPI } from "./botapi"
import { useHotkeys } from "react-hotkeys-hook"

// Create a new Uesio API instance for use inside of a component
class Uesio {
	constructor(props: BaseProps) {
		this._path = props.path || ""
		this._context = props.context || new Context()
		this._componentType = props.componentType || ""

		this.signal = new SignalAPI(this)
		this.wire = new WireAPI(this)
		this.builder = new BuilderAPI(this)
		this.view = new ViewAPI(this)
		this.file = new FileAPI(this)
		this.component = new ComponentAPI(this)
		this.platform = new PlatformAPI(this)
		this.collection = new CollectionAPI(this)
		this.configvalue = new ConfigValueAPI(this)
		this.secret = new SecretAPI(this)
		this.featureflag = new FeatureFlagAPI(this)
		this.theme = new ThemeAPI(this)
		this.notification = new NotificationAPI(this)
		this.bot = new BotAPI(this)
	}

	// Public Apis
	signal: SignalAPI
	wire: WireAPI
	builder: BuilderAPI
	view: ViewAPI
	file: FileAPI
	component: ComponentAPI
	platform: PlatformAPI
	collection: CollectionAPI
	configvalue: ConfigValueAPI
	secret: SecretAPI
	featureflag: FeatureFlagAPI
	theme: ThemeAPI
	notification: NotificationAPI
	bot: BotAPI

	_path: string
	_context: Context
	_componentType: string

	getPath = () => this._path
	getComponentType = () => this._componentType
	getContext = () => this._context
	getTheme = () => this.getContext().getTheme()
	getViewId = () => this.getContext().getViewId()
	getViewDef = () => this.getContext().getViewDef()
	getViewDefId = () => this.getContext().getViewDefId()
	addContextFrame = (frame: ContextFrame) =>
		(this._context = this._context.addFrame(frame))
	setContext = (context: Context) => (this._context = context)
}

const useUesio = (props: BaseProps) => new Uesio(props)

export { useUesio, Uesio, useHotkeys }
