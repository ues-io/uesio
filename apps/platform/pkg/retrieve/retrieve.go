package retrieve

import (
	"context"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func NewWriterCreator(creator func(string) (io.Writer, error)) bundlestore.FileCreator {
	return func(path string) (io.WriteCloser, error) {
		w, err := creator(path)
		if err != nil {
			return nil, err
		}
		return NopWriterCloser(w), nil
	}
}

func NopWriterCloser(w io.Writer) io.WriteCloser {
	return nopWriterCloser{w}
}

type nopWriterCloser struct {
	io.Writer
}

func (nopWriterCloser) Close() error { return nil }

const (
	BundleDirectory = "bundle"
	GeneratedDir    = "generated"
	uesioTypesDir   = "@types/@uesio"
	clientTypesSrc  = "../../dist/ui/types/client"
)

// GenerateAppTypeScriptTypes creates a giant file of all app-specific TypeScript type definitions
func GenerateAppTypeScriptTypes(ctx context.Context, out io.Writer, bs bundlestore.BundleStoreConnection) error {
	// Add app specific metadata types app-specific metadata types
	for _, group := range meta.GetMetadataTypesWithTypescriptDefinitions() {
		metadataType := group.GetName()
		genOptions := group.GetTypeGenerationOptions()
		err := bs.GetAllItems(ctx, group, &bundlestore.GetAllItemsOptions{
			Conditions: genOptions.GetTypescriptableItemConditions(),
		})
		if err != nil {
			return fmt.Errorf("failed to retrieve items of type: %s : %w", metadataType, err)
		}
		var typeDefsByNamespace map[string]*strings.Builder
		// If needed, generate a wrapper module around all types for this group
		if genOptions.GenerateModuleForNamespace {
			typeDefsByNamespace = map[string]*strings.Builder{}
		}
		err = group.Loop(func(item meta.Item, _ string) error {
			typedItem, hasTSTypes := item.(meta.TypescriptableItem)
			if !hasTSTypes {
				return nil
			}
			typeDefinitions, err := typedItem.GenerateTypeDefinitions()
			if err != nil {
				return err
			}
			if typeDefinitions == "" {
				return nil
			}
			if typeDefsByNamespace != nil {
				namespaceBuilder, exists := typeDefsByNamespace[typedItem.GetNamespace()]
				if !exists {
					namespaceBuilder = &strings.Builder{}
					typeDefsByNamespace[typedItem.GetNamespace()] = namespaceBuilder
				}
				_, err = namespaceBuilder.WriteString(typeDefinitions)
				if err != nil {
					return err
				}
			} else {
				_, err = out.Write([]byte(typeDefinitions))
				if err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			return err
		}
		// If we need to output types grouped by namespace, iterate over each namespace
		for ns, stringBuilder := range typeDefsByNamespace {
			// Write the wrapper
			_, err = out.Write([]byte(`
declare module "@uesio/app/` + group.GetBundleFolderName() + "/" + ns + "\" {"))
			if err != nil {
				return err
			}
			// write all types for the namespace
			typesForNS := stringBuilder.String()
			_, err = out.Write([]byte(typesForNS))
			if err != nil {
				return err
			}
			// Write the end of the module
			_, err = out.Write([]byte("\n}"))
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func RetrieveGeneratedFiles(ctx context.Context, targetDirectory string, create bundlestore.FileCreator, bs bundlestore.BundleStoreConnection) error {
	wd, err := os.Getwd()
	if err != nil {
		return err
	}
	// Add all Uesio-provided types
	err = copyFileIntoZip(create, filepath.Join(wd, clientTypesSrc, "index.d.ts"), path.Join(GeneratedDir, uesioTypesDir, "index.d.ts"))
	if err != nil {
		return err
	}
	// Generate app specific type definitions
	f, err := create(path.Join(GeneratedDir, uesioTypesDir, "app.d.ts"))
	defer f.Close()
	if err != nil {
		return err
	}
	if err := GenerateAppTypeScriptTypes(ctx, f, bs); err != nil {
		return err
	}
	return nil
}

// RetrieveBundle retrieves the content of a specific bundle version into the designated targetDirectory
func RetrieveBundle(ctx context.Context, targetDirectory string, create bundlestore.FileCreator, bs bundlestore.BundleStoreConnection) error {

	for _, metadataType := range meta.GetMetadataTypes() {
		group, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return err
		}
		err = bs.GetAllItems(ctx, group, nil)
		if err != nil {
			return fmt.Errorf("failed to retrieve items of type: %s : %w", metadataType, err)
		}

		err = group.Loop(func(item meta.Item, _ string) error {

			itempath := item.(meta.BundleableItem).GetPath()

			f, err := create(path.Join(targetDirectory, metadataType, itempath))
			if err != nil {
				return fmt.Errorf("failed to create %s file: %s : %w", metadataType, itempath, err)
			}
			defer f.Close()

			encoder := yaml.NewEncoder(f)
			encoder.SetIndent(2)
			err = encoder.Encode(item)
			if err != nil {
				return fmt.Errorf("failed to encode metadata item of type %s into YAML: %s : %w", metadataType, itempath, err)
			}

			attachableItem, isAttachable := item.(meta.AttachableItem)

			if isAttachable {
				err := bs.GetItemAttachments(ctx, func(localpath string) (io.WriteCloser, error) {
					return create(path.Join(targetDirectory, metadataType, attachableItem.GetBasePath(), localpath))
				}, attachableItem)
				if err != nil {
					return err
				}
			}

			return nil
		})
		if err != nil {
			return err
		}

	}

	// Add bundle.yaml
	bundleDef, err := bs.GetBundleDef(ctx)
	if err != nil {
		return err
	}

	f, err := create(path.Join(targetDirectory, "bundle.yaml"))
	if err != nil {
		return fmt.Errorf("failed to create bundle.yaml file: %w", err)
	}
	defer f.Close()

	encoder := yaml.NewEncoder(f)
	encoder.SetIndent(2)
	err = encoder.Encode(bundleDef)
	if err != nil {
		return fmt.Errorf("failed to encode bundle.yaml file into YAML: %w", err)
	}

	return nil

}

func copyFileIntoZip(create bundlestore.FileCreator, sourcePath, targetPath string) error {
	source, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer source.Close()

	f, err := create(targetPath)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = io.Copy(f, source)
	if err != nil {
		return fmt.Errorf("failed to create file at path %s : %w", targetPath, err)
	}
	return nil
}
