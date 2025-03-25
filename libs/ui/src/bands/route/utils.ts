import { platform } from "../../platform/platform"
import { Dependencies } from "./types"
import { setMany as setComponentVariant } from "../componentvariant"
import { setMany as setConfigValue } from "../configvalue"
import { setMany as setLabel } from "../label"
import { upsertMany as setViewDef } from "../viewdef"
import { setMany as setTheme } from "../theme"
import { setMany as setFeatureFlag } from "../featureflag"
import { setMany as setFile } from "../file"
import { setMany as setComponent } from "../component"
import { setMany as setComponentTypes } from "../componenttype"
import { setMany as setSelectList } from "../selectlist"
import { setMany as setRouteAssignment } from "../routeassignment"
import { initAll as initWire } from "../wire"
import { init as initCollection } from "../collection"
import { ViewMetadata } from "../../definition/definition"
import { Context } from "../../context/context"
import { initExistingWire } from "../wire/operations/initialize"
import { PlainWire, ServerWire } from "../wire/types"
import { dispatch } from "../../store/store"
import { transformServerWire } from "../wire/transform"
import { getKey } from "../../metadata/metadata"
import { ComponentPackState } from "../../definition/componentpack"

const extractComponentIdFromViewId = (viewId: string) =>
  viewId.split("(")[1].slice(0, -1)

const attachDefToWires = (wires?: ServerWire[], viewdefs?: ViewMetadata[]) => {
  if (!wires || !viewdefs) return [] as PlainWire[]
  return wires.map((wire) => {
    const viewId = wire.view.split("(")[0]
    const wireDef = viewdefs.find((viewdef) => getKey(viewdef) === viewId)
      ?.definition.wires?.[wire.name]
    if (!wireDef)
      throw new Error(
        `Could not find wire def for wire: ${wire.view} : ${wire.name}`,
      )
    return initExistingWire(transformServerWire(wire), wireDef)
  })
}

const dispatchRouteDeps = (deps: Dependencies | undefined) => {
  if (!deps) return
  const { viewdef, wire } = deps
  if (deps.collection) dispatch(initCollection(deps.collection))
  if (deps.component) dispatch(setComponent(deps.component))
  if (deps.componenttype) dispatch(setComponentTypes(deps.componenttype))
  if (deps.componentvariant)
    dispatch(setComponentVariant(deps.componentvariant))
  if (deps.configvalue) dispatch(setConfigValue(deps.configvalue))
  if (deps.featureflag) dispatch(setFeatureFlag(deps.featureflag))
  if (deps.file) dispatch(setFile(deps.file))
  if (deps.label) dispatch(setLabel(deps.label))
  if (deps.routeassignment) dispatch(setRouteAssignment(deps.routeassignment))
  if (deps.selectlist) dispatch(setSelectList(deps.selectlist))
  if (deps.theme) dispatch(setTheme(deps.theme))
  if (deps.viewdef) dispatch(setViewDef(deps.viewdef))

  // Special case - need both wire and viewdef to init wire state
  if (wire && viewdef) {
    dispatch(initWire(attachDefToWires(wire, viewdef) || []))
  }
}

const getPackUrlsForDeps = (
  packDeps: ComponentPackState[] | undefined,
  context: Context,
) => {
  if (!packDeps) return []
  return packDeps.flatMap((pack) => {
    const contextToUse = pack.siteOnly ? context.deleteWorkspace() : context
    const js = platform.getComponentPackURL(
      contextToUse,
      pack.namespace,
      pack.name,
      `${pack.updatedAt || 0}`,
    )
    if (pack.hasStyles) {
      const css = platform.getComponentPackURL(
        contextToUse,
        pack.namespace,
        pack.name,
        `${pack.updatedAt || 0}`,
        "runtime.css",
      )
      return [js, css]
    }
    return [js]
  })
}

export {
  dispatchRouteDeps,
  getPackUrlsForDeps,
  attachDefToWires,
  extractComponentIdFromViewId,
}
