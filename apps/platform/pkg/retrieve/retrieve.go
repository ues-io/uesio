package retrieve

import (
	"archive/zip"
	"errors"
	"io"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

type WriterCreator func(fileName string) (io.Writer, error)

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
	err = RetrieveBundle(zipwriter.Create, namespace, version, bs, session)
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
			return err
		}

		err = group.Loop(func(item meta.Item, _ string) error {

			path := item.(meta.BundleableItem).GetPath()

			f, err := create(filepath.Join(metadataType, path))
			if err != nil {
				return err
			}

			encoder := yaml.NewEncoder(f)
			encoder.SetIndent(2)
			encoder.Encode(item)

			attachableItem, isAttachable := item.(meta.AttachableItem)

			if isAttachable {
				paths, err := bs.GetAttachmentPaths(attachableItem, version, session)
				if err != nil {
					return err
				}
				for _, path := range paths {
					attachment, err := bs.GetItemAttachment(attachableItem, version, path, session)
					if err != nil {
						return err
					}
					f, err := create(filepath.Join(metadataType, attachableItem.GetBasePath(), path))
					if err != nil {
						return err
					}
					_, err = io.Copy(f, attachment)
					if err != nil {
						return err
					}
				}
			}

			return nil
		})
		if err != nil {
			return err
		}

	}

	by := session.GetWorkspace().GetAppBundle()

	f, err := create("bundle.yaml")
	if err != nil {
		return err
	}

	encoder := yaml.NewEncoder(f)
	encoder.SetIndent(2)
	encoder.Encode(by)

	return nil

}
