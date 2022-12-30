import * as signal from "./signalapi"
import * as wire from "./wireapi"
import * as builder from "./builderapi"
import * as view from "./viewapi"
import * as file from "./fileapi"
import * as component from "./componentapi"
import * as platform from "./platformapi"
import * as collection from "./collectionapi"
import { BaseProps } from "../definition/definition"
import * as configvalue from "./configvalueapi"
import * as secret from "./secretapi"
import * as notification from "./notificationapi"
import * as featureflag from "./featureflagapi"
import * as bot from "./botapi"
import { useHotKeyCallback } from "./hotkeys"

const api = {
	signal,
	wire,
	builder,
	view,
	file,
	component,
	platform,
	collection,
	configvalue,
	secret,
	featureflag,
	notification,
	bot,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useUesio = (props?: BaseProps) => api

export { useUesio, useHotKeyCallback }
