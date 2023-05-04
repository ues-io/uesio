package retrieve

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

type WriterCreator func(fileName string) (io.WriteCloser, error)

func NewWriterCreator(creator func(string) (io.Writer, error)) WriterCreator {
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
	bundleDirectory = "bundle"
	generatedDir    = "generated"
	uesioTypesDir   = "@uesio"
)

func Retrieve(writer io.Writer, session *sess.Session) error {
	workspace := session.GetWorkspace()
	if workspace == nil {
		return errors.New("No Workspace provided for retrieve")
	}
	namespace := workspace.GetAppFullName()
	version, bs, err := bundle.GetBundleStoreWithVersion(namespace, session)
	if err != nil {
		return err
	}
	// Create a new zip archive.
	zipwriter := zip.NewWriter(writer)
	create := NewWriterCreator(zipwriter.Create)
	// Retrieve bundle contents
	err = RetrieveBundle(bundleDirectory, create, namespace, version, bs, session)
	if err != nil {
		return err
	}
	wd, err := os.Getwd()
	if err != nil {
		return err
	}
	// Add generated type files
	// uesio/bots
	err = addGeneratedFile(create, filepath.Join(wd, "../../dist/ui/types/server/index.d.ts"), filepath.Join("generated", "@uesio", "bots.d.ts"))
	if err != nil {
		return err
	}
	// @uesio/ui
	err = addGeneratedFile(create, filepath.Join(wd, "../../dist/ui/types/client/index.d.ts"), filepath.Join("generated", "@uesio", "ui.d.ts"))
	if err != nil {
		return err
	}

	return zipwriter.Close()
}

// RetrieveBundle retrieves the content of a specific bundle version into the designated targetDirectory
func RetrieveBundle(targetDirectory string, create WriterCreator, namespace, version string, bs bundlestore.BundleStore, session *sess.Session) error {

	for _, metadataType := range meta.GetMetadataTypes() {
		group, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return err
		}
		err = bs.GetAllItems(group, namespace, version, nil, session, nil)
		if err != nil {
			return errors.New("failed to retrieve items of type: " + metadataType + ": " + err.Error())
		}

		err = group.Loop(func(item meta.Item, _ string) error {

			path := item.(meta.BundleableItem).GetPath()

			f, err := create(filepath.Join(targetDirectory, metadataType, path))
			if err != nil {
				return errors.New("failed to create " + metadataType + " file: " + path + ": " + err.Error())
			}
			defer f.Close()

			encoder := yaml.NewEncoder(f)
			encoder.SetIndent(2)
			err = encoder.Encode(item)
			if err != nil {
				return errors.New("failed to encode metadata item of type " + metadataType + " into YAML: " + path + ": " + err.Error())
			}

			attachableItem, isAttachable := item.(meta.AttachableItem)

			if isAttachable {
				paths, err := bs.GetAttachmentPaths(attachableItem, version, session)
				if err != nil {
					return err
				}
				for _, path := range paths {
					_, attachment, err := bs.GetItemAttachment(attachableItem, version, path, session)
					if err != nil {
						return err
					}
					f, err := create(filepath.Join(targetDirectory, metadataType, attachableItem.GetBasePath(), path))
					if err != nil {
						return err
					}
					_, err = io.Copy(f, attachment)
					if err != nil {
						f.Close()
						return err
					}
					f.Close()
				}
			}

			return nil
		})
		if err != nil {
			return err
		}

	}

	// Add bundle.yaml
	by := session.GetWorkspace().GetAppBundle()

	f, err := create(filepath.Join(targetDirectory, "bundle.yaml"))
	if err != nil {
		return errors.New("failed to create bundle.yaml file: " + err.Error())
	}
	defer f.Close()

	encoder := yaml.NewEncoder(f)
	encoder.SetIndent(2)
	err = encoder.Encode(by)
	if err != nil {
		return errors.New("failed to encode bundle.yaml file into YAML: " + err.Error())
	}

	return nil

}

func addGeneratedFile(create WriterCreator, sourcePath, targetPath string) error {
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
