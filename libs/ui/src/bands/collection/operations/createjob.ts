import { Context } from "../../../context/context"
import { platform } from "../../../platform/platform"
import { Spec } from "../../../definition/definition"

const createJob = async (collection: string, context: Context) => {
  const spec: Spec = {
    jobtype: "EXPORT",
    collection,
    filetype: "CSV",
  }
  await platform.createJob(context, spec)
  return context
}

export default createJob
