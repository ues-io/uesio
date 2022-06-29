import get from "lodash/get"
import toPath from "lodash/toPath"
import { getErrorString } from "./bands/utils"
import * as yaml from "./yamlutils/yamlutils"

const isValidNameSpace = (str: string) => /\w+\/\w+\.\w+/.test(str)

export { get, toPath, yaml, getErrorString, isValidNameSpace }
