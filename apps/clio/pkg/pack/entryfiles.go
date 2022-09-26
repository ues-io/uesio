package pack

import (
	"fmt"
	"os"
	"strings"

	"github.com/thecloudmasters/clio/pkg/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func CreateEntryFiles() ([]string, error) {
	sbs := &localbundlestore.LocalBundleStore{}

	def, err := sbs.GetBundleDef("", "", nil, nil)
	if err != nil {
		return nil, err
	}

	// Create a fake session
	namespace := def.Name

	packs := &meta.ComponentPackCollection{}

	err = sbs.GetAllItems(packs, "", "", nil, nil)
	if err != nil {
		return nil, err
	}

	entryPoints := []string{}

	// Create the entry files
	for _, pack := range *packs {
		runtimeImports := []string{"import { component } from \"@uesio/ui\";"}
		runtimeRegistrations := []string{}
		builderImports := []string{"import { component } from \"@uesio/ui\";"}
		builderDefImports := []string{}
		builderRegistrations := []string{}
		// Loop over the components
		for key := range pack.Components.ViewComponents {
			hasDefinition := fileExists(fmt.Sprintf("bundle/components/view/%[1]s/%[1]s.tsx", key))
			hasBuilder := fileExists(fmt.Sprintf("bundle/components/view/%[1]s/%[1]sbuilder.tsx", key))
			hasBuilderDef := fileExists(fmt.Sprintf("bundle/components/view/%[1]s/%[1]sdefinition.ts", key))
			hasSignals := fileExists(fmt.Sprintf("bundle/components/view/%[1]s/signals.ts", key))
			if hasDefinition {
				runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]s from \"../../components/view/%[1]s/%[1]s\";", key))

				if hasSignals {
					runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]ssignals from \"../../components/view/%[1]s/signals\";", key))
					runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.register(\"%[2]s.%[1]s\",%[1]s,%[1]ssignals);", key, namespace))
				} else {
					runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.register(\"%[2]s.%[1]s\",%[1]s);", key, namespace))
				}
			}
			builderName := fmt.Sprintf("%[1]sbuilder", key)
			definitionName := fmt.Sprintf("%[1]sdefinition", key)
			if hasBuilder {
				builderImports = append(builderImports, fmt.Sprintf("import %[2]s from \"../../components/view/%[1]s/%[2]s\";", key, builderName))
			}
			if hasBuilderDef {
				builderDefImports = append(builderDefImports, fmt.Sprintf("import %[2]s from \"../../components/view/%[1]s/%[2]s\";", key, definitionName))
			}
			if hasBuilder || hasBuilderDef {
				builderValue := "undefined"
				if hasBuilder {
					builderValue = builderName
				}
				defValue := "undefined"
				if hasBuilderDef {
					defValue = definitionName
				}
				builderRegistrations = append(builderRegistrations, fmt.Sprintf("component.registry.registerBuilder(\"%[2]s.%[1]s\",%[3]s,%[4]s);", key, namespace, builderValue, defValue))
			}
		}

		for key := range pack.Components.UtilityComponents {
			hasDefinition := fileExists(fmt.Sprintf("bundle/components/utility/%[1]s/%[1]s.tsx", key))
			if hasDefinition {
				runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]s_utility from \"../../components/utility/%[1]s/%[1]s\";", key))
				runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.registerUtilityComponent(\"%[2]s.%[1]s\",%[1]s_utility)", key, namespace))
			}
		}

		runtimeEntry := strings.Join(append(runtimeImports, runtimeRegistrations...), "\n")
		builderEntry := strings.Join(append(builderImports, append(builderDefImports, builderRegistrations...)...), "\n")

		runtimeFileName := fmt.Sprintf("bundle/componentpacks/%[1]s/runtime.ts", pack.Name)
		builderFileName := fmt.Sprintf("bundle/componentpacks/%[1]s/builder.ts", pack.Name)
		err := os.WriteFile(runtimeFileName, []byte(runtimeEntry), 0777)
		if err != nil {
			return nil, err
		}

		err = os.WriteFile(builderFileName, []byte(builderEntry), 0777)
		if err != nil {
			return nil, err
		}

		entryPoints = append(entryPoints, runtimeFileName, builderFileName)

	}

	return entryPoints, nil

}
