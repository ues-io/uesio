import { BaseProps } from "../definition/definition"

import * as api from "../api/api"

import { useHotKeyCallback } from "./hotkeys"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useUesio = (props?: BaseProps) => api

export { useUesio, useHotKeyCallback }
