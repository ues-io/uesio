import { SignalAPI } from "./signalapi"
import { WireAPI } from "./wireapi"
import { getDispatcher, Dispatcher } from "../store/store"
import { BuilderAPI } from "./builderapi"
import { ViewAPI } from "./viewapi"
import { FileAPI } from "./fileapi"
import { ComponentAPI } from "./componentapi"
import { PlatformAPI } from "./platformapi"
import { CollectionAPI } from "./collectionapi"
import { BaseProps } from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import { AnyAction } from "redux"
import { ConfigValueAPI } from "./configvalueapi"
import { SecretAPI } from "./secretapi"
import { ThemeAPI } from "./themeapi"

// Create a new Uesio API instance for use inside a component
class Uesio {
	constructor(dispatcher: Dispatcher<AnyAction>, props: BaseProps) {
		this._dispatcher = dispatcher

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
		this.theme = new ThemeAPI(this)
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
	theme: ThemeAPI

	_path: string
	_context: Context
	_componentType: string

	_dispatcher: Dispatcher<AnyAction>

	getPath = () => this._path
	getComponentType = () => this._componentType
	getContext = () => this._context
	getDispatcher = () => this._dispatcher
	getView = () => this.getContext().getView()
	getTheme = () => this.getContext().getTheme()
	getViewId = () => this.getContext().getViewId()
	getViewDef = () => this.getContext().getViewDef()
	getViewDefId = () => this.getContext().getViewDefId()
	addContextFrame = (frame: ContextFrame) =>
		(this._context = this._context.addFrame(frame))
}

const useUesio = (props: BaseProps) => new Uesio(getDispatcher(), props)

export { useUesio, Uesio }
