import { SignalAPI } from "./signalapi"
import { WireAPI } from "./wireapi"
import { getDispatcher, Dispatcher } from "../store/store"
import { BuilderAPI } from "./builderapi"
import { ViewAPI } from "./viewapi"
import { FileAPI } from "./fileapi"
import { ComponentAPI } from "./componentapi"
import { PlatformAPI } from "./platformapi"
import { BaseProps } from "../definition/definition"
import { RouteAPI } from "./routeapi"
import { ContextFrame, Context } from "../context/context"
import { StoreAction } from "../store/actions/actions"

// Create a new Uesio API instance for use inside a component
class Uesio {
	constructor(dispatcher: Dispatcher<StoreAction>, props?: BaseProps) {
		this._dispatcher = dispatcher
		this._props = props || {
			path: "",
			context: new Context(),
		}

		this.signal = new SignalAPI(this)
		this.wire = new WireAPI(this)
		this.builder = new BuilderAPI(this)
		this.view = new ViewAPI(this)
		this.file = new FileAPI(this)
		this.component = new ComponentAPI(this)
		this.platform = new PlatformAPI(this)
		this.route = new RouteAPI(this)
	}

	// Public Apis
	signal: SignalAPI
	wire: WireAPI
	builder: BuilderAPI
	view: ViewAPI
	route: RouteAPI
	file: FileAPI
	component: ComponentAPI
	platform: PlatformAPI

	_props: BaseProps
	_dispatcher: Dispatcher<StoreAction>

	getProps = () => this._props
	getPath = () => this._props.path
	getComponentType = () => this._props.componentType || ""
	getContext = () => this._props.context
	getDispatcher = () => this._dispatcher
	getView = () => this.getContext().getView()
	getViewId = () => this.getContext().getViewId()
	addContextFrame = (frame: ContextFrame) => {
		this._props.context = this.getContext().addFrame(frame)
	}
}

const useUesio = (props?: BaseProps) => new Uesio(getDispatcher(), props)

export { useUesio, Uesio }
