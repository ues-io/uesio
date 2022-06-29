import get from "lodash/get"
import toPath from "lodash/toPath"
import { getErrorString } from "./bands/utils"
import * as yaml from "./yamlutils/yamlutils"

const isValidNameSpace = (str: string) => /\w+\/\w+\.\w+/.test(str)
type MetaDataKey = `${string}/${string}.${string}`

export { get, toPath, yaml, getErrorString, isValidNameSpace, MetaDataKey }
