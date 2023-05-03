package retrieve

import (
	"archive/zip"
	"errors"
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
	err = RetrieveBundle(NewWriterCreator(zipwriter.Create), namespace, version, bs, session)
	if err != nil {
		return err
	}
	return zipwriter.Close()
}

func RetrieveBundle(create WriterCreator, namespace, version string, bs bundlestore.BundleStore, session *sess.Session) error {

	for _, metadataType := range meta.GetMetadataTypes() {
		group, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return err
		}
		err = bs.GetAllItems(group, namespace, version, nil, session, nil)
		if err != nil {
			return errors.New("Failed to retrieve items of type: " + metadataType + ": " + err.Error())
		}

		err = group.Loop(func(item meta.Item, _ string) error {

			path := item.(meta.BundleableItem).GetPath()

			f, err := create(filepath.Join("bundle", metadataType, path))
			if err != nil {
				return errors.New("Failed to create " + metadataType + " file: " + path + ": " + err.Error())
			}
			defer f.Close()

			encoder := yaml.NewEncoder(f)
			encoder.SetIndent(2)
			err = encoder.Encode(item)
			if err != nil {
				return errors.New("Failed to encode metadata item of type " + metadataType + " into YAML: " + path + ": " + err.Error())
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
					f, err := create(filepath.Join("bundle", metadataType, attachableItem.GetBasePath(), path))
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

	f, err := create(filepath.Join("bundle", "bundle.yaml"))
	if err != nil {
		return errors.New("Failed to create bundle.yaml file: " + err.Error())
	}
	defer f.Close()

	encoder := yaml.NewEncoder(f)
	encoder.SetIndent(2)
	err = encoder.Encode(by)
	if err != nil {
		return errors.New("Failed to encode bundle.yaml file into YAML: " + err.Error())
	}

	wd, err := os.Getwd()
	if err != nil {
		return err
	}

	// Add uesio/bots types
	source, err := os.Open(filepath.Join(wd, "../../dist/ui/types/server/index.d.ts"))
	if err != nil {
		return err
	}
	defer source.Close()

	f, err = create(filepath.Join("generated", "@uesio", "bots.d.ts"))
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = io.Copy(f, source)
	if err != nil {
		return errors.New("Failed to create uesio server types file: " + err.Error())
	}

	// Add @uesio/ui module types
	source, err = os.Open(filepath.Join(wd, "../../dist/ui/types/client/index.d.ts"))
	if err != nil {
		return err
	}
	defer source.Close()

	f, err = create(filepath.Join("generated", "@uesio", "ui.d.ts"))
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = io.Copy(f, source)
	if err != nil {
		return errors.New("Failed to create uesio ui types file: " + err.Error())
	}

	return nil

}
