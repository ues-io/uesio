import { component } from "@uesio/ui";
import hello from "../components/hello/hello";
import error from "../components/error/error";
import progressgauge from "../components/progressgauge/progressgauge";
component.registry.register("sample", "hello", hello);
component.registry.register("sample", "error", error);
component.registry.register("sample", "progressgauge", progressgauge);