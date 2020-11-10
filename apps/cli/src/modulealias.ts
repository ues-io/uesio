// This is really dumb, but when typescript compiles, module
// paths are not resolved in emitted code. There's a long discussion
// and lots of angry people in this github issue.
// https://github.com/microsoft/TypeScript/issues/10866
// In the end, the typescript people say it's not their job to resolve
// modules and that the aren't going to change it.

// This is a somewhat hack that resolves the module-alias for us so we can
// use the share code in the nx way. We could possibly get rid of this
// if we used webpack in addition to typescript to bundle up the cli commands.
import * as moduleAlias from "module-alias"
moduleAlias.addAlias("@uesio/constants", "../../../../libs/constants/src")
