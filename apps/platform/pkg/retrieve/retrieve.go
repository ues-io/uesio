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

func Retrieve(session *sess.Session) ([]bundlestore.ItemStream, error) {
	workspace := session.GetWorkspace()
	if workspace == nil {
		return nil, errors.New("No Workspace provided for retrieve")
	}
	namespace := workspace.GetAppFullName()
	version, bs, err := bundle.GetBundleStoreWithVersion(namespace, session)
	if err != nil {
		return nil, err
	}
	return RetrieveBundle(namespace, version, bs, session)
}

func RetrieveBundle(namespace, version string, bs bundlestore.BundleStore, session *sess.Session) ([]bundlestore.ItemStream, error) {
	itemStreams := bundlestore.ItemStreams{}

	for _, metadataType := range meta.GetMetadataTypes() {
		group, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return nil, err
		}
		err = bs.GetAllItems(group, namespace, version, nil, session, nil)
		if err != nil {
			return nil, err
		}

		err = group.Loop(func(item meta.Item, _ string) error {

			path := item.(meta.BundleableItem).GetPath()
			// Grabs the componentpack javascript files
			if metadataType == "componentpacks" {
				cp := item.(*meta.ComponentPack)

				builderStream, err := bs.GetComponentPackStream(version, cp.GetComponentPackFilePath(true), cp, session)
				if err != nil {
					return err
				}
				itemStreams.AddFile(cp.GetComponentPackFilePath(true), metadataType, builderStream)

				runtimeStream, err := bs.GetComponentPackStream(version, cp.GetComponentPackFilePath(false), cp, session)
				if err != nil {
					return err
				}
				itemStreams.AddFile(cp.GetComponentPackFilePath(false), metadataType, runtimeStream)

			}
			// Special handling for bots
			if metadataType == "bots" {
				bot := item.(*meta.Bot)

				stream, err := bs.GetBotStream(version, bot, session)
				if err != nil {
					return err
				}

				itemStreams.AddFile(bot.GetBotFilePath(), metadataType, stream)

			}

			// Special handling for files
			if metadataType == "files" {
				file := item.(*meta.File)

				if file.Content != nil {
					stream, err := bs.GetFileStream(version, file, session)
					if err != nil {
						return err
					}

					itemStreams.AddFile(file.GetFilePath(), metadataType, stream)

				}

			}

			r := bundlestore.GetFileReader(func(data io.Writer) error {
				encoder := yaml.NewEncoder(data)
				encoder.SetIndent(2)
				return encoder.Encode(item)
			})

			itemStreams.AddFile(path, metadataType, r)

			return nil
		})
		if err != nil {
			return nil, err
		}

	}

	by := session.GetWorkspace().GetAppBundle()

	r := bundlestore.GetFileReader(func(data io.Writer) error {
		encoder := yaml.NewEncoder(data)
		encoder.SetIndent(2)
		return encoder.Encode(by)
	})

	itemStreams.AddFile("bundle.yaml", "", r)

	return itemStreams, nil

}

func Zip(writer io.Writer, files []bundlestore.ItemStream, session *sess.Session) error {

	// Create a new zip archive.
	zipWriter := zip.NewWriter(writer)

	for _, itemStream := range files {
		f, err := zipWriter.Create(filepath.Join(itemStream.Type, itemStream.FileName))
		if err != nil {
			return err
		}

		_, err = io.Copy(f, itemStream.File)
		if err != nil {
			return err
		}
	}

	// Make sure to check the error on Close.
	return zipWriter.Close()

}
