import { component } from "@uesio/ui";
import hellobuilder from "../components/hello/hellobuilder";
import errorbuilder from "../components/error/errorbuilder";
import progressgaugebuilder from "../components/progressgauge/progressgaugebuilder";
import datePickerbuilder from "../components/datePicker/datePickerbuilder"

import hellodefinition from "../components/hello/hellodefinition";
import errordefinition from "../components/error/errordefinition";
import progressgaugedefinition from "../components/progressgauge/progressgaugedefinition";
import datePickerdefinition from "../components/datePicker/datePickerdefinition"

component.registry.registerBuilder("sample", "hello", hellobuilder, hellodefinition);
component.registry.registerBuilder("sample", "error", errorbuilder, errordefinition);
component.registry.registerBuilder("sample", "progressgauge", progressgaugebuilder, progressgaugedefinition);
component.registry.registerBuilder(
	"sample",
	"hello",
	hellobuilder,
	hellodefinition
)
component.registry.registerBuilder(
	"sample",
	"error",
	errorbuilder,
	errordefinition
)
component.registry.registerBuilder(
	"sample",
	"progressgauge",
	progressgaugebuilder,
	progressgaugedefinition
)
component.registry.registerBuilder(
	"sample",
	"datePicker",
	datePickerbuilder,
	datePickerdefinition
) 