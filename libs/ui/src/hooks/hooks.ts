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
import { ContextFrame, Context } from "../context/context"
import { AnyAction } from "redux"

// Create a new Uesio API instance for use inside a component
class Uesio {
	constructor(dispatcher: Dispatcher<AnyAction>, props?: BaseProps) {
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
		this.collection = new CollectionAPI(this)
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

	_props: BaseProps
	_dispatcher: Dispatcher<AnyAction>

	getProps = () => this._props
	getPath = () => this._props.path
	getComponentType = () => this._props.componentType || ""
	getContext = () => this._props.context
	getDispatcher = () => this._dispatcher
	getView = () => this.getContext().getView()
	getViewId = () => this.getContext().getViewId()
	getViewDef = () => this.getContext().getViewDef()
	getViewDefId = () => this.getContext().getViewDefId()
	getWireDef = (wirename: string) => this.getContext().getWireDef(wirename)
	addContextFrame = (frame: ContextFrame) => {
		this._props.context = this.getContext().addFrame(frame)
	}
}

const useUesio = (props?: BaseProps) => new Uesio(getDispatcher(), props)

export { useUesio, Uesio }
