package retrieve

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"gopkg.in/yaml.v3"
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

func RetrieveGeneratedFiles(targetDirectory string, create bundlestore.FileCreator) error {
	wd, err := os.Getwd()
	if err != nil {
		return err
	}
	// Add all Uesio-provided types
	err = copyFileIntoZip(create, filepath.Join(wd, clientTypesSrc, "index.d.ts"), path.Join(GeneratedDir, uesioTypesDir, "index.d.ts"))
	if err != nil {
		return err
	}
	// Add package.json to generated directory so that TS will know where to find the types
	err = copyFileIntoZip(create, filepath.Join(wd, clientTypesSrc, "package.json"), path.Join(GeneratedDir, uesioTypesDir, "package.json"))
	if err != nil {
		return err
	}

	return nil
}

// RetrieveBundle retrieves the content of a specific bundle version into the designated targetDirectory
func RetrieveBundle(targetDirectory string, create bundlestore.FileCreator, bs bundlestore.BundleStoreConnection) error {

	for _, metadataType := range meta.GetMetadataTypes() {
		group, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return err
		}
		err = bs.GetAllItems(group, nil)
		if err != nil {
			return errors.New("failed to retrieve items of type: " + metadataType + ": " + err.Error())
		}

		err = group.Loop(func(item meta.Item, _ string) error {

			itempath := item.(meta.BundleableItem).GetPath()

			f, err := create(path.Join(targetDirectory, metadataType, itempath))
			if err != nil {
				return errors.New("failed to create " + metadataType + " file: " + itempath + ": " + err.Error())
			}
			defer f.Close()

			encoder := yaml.NewEncoder(f)
			encoder.SetIndent(2)
			err = encoder.Encode(item)
			if err != nil {
				return errors.New("failed to encode metadata item of type " + metadataType + " into YAML: " + itempath + ": " + err.Error())
			}

			attachableItem, isAttachable := item.(meta.AttachableItem)

			if isAttachable {
				err := bs.GetItemAttachments(func(localpath string) (io.WriteCloser, error) {
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
	bundleDef, err := bs.GetBundleDef()
	if err != nil {
		return err
	}

	f, err := create(path.Join(targetDirectory, "bundle.yaml"))
	if err != nil {
		return errors.New("failed to create bundle.yaml file: " + err.Error())
	}
	defer f.Close()

	encoder := yaml.NewEncoder(f)
	encoder.SetIndent(2)
	err = encoder.Encode(bundleDef)
	if err != nil {
		return errors.New("failed to encode bundle.yaml file into YAML: " + err.Error())
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
		return fmt.Errorf("failed to create file at path %s : %s", targetPath, err.Error())
	}
	return nil
}
