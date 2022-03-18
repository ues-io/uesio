package retrieve

import (
	"archive/zip"
	"io"
	"path/filepath"

	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Retrieve func
func Retrieve(session *sess.Session) ([]bundlestore.ItemStream, error) {
	namespace := session.GetWorkspaceApp()
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
		err = bs.GetAllItems(group, namespace, version, nil, session)
		if err != nil {
			return nil, err
		}

		err = group.Loop(func(item loadable.Item, _ string) error {

			path := item.(meta.BundleableItem).GetPath()
			// Grabs the componentpack javascript files
			if metadataType == "componentpacks" {
				cp := item.(*meta.ComponentPack)
				builderStream, err := bs.GetComponentPackStream(version, true, cp, session)
				if err != nil {
					return err
				}
				itemStreams.AddFile(cp.GetComponentPackFilePath(true), metadataType, builderStream)

				runtimeStream, err := bs.GetComponentPackStream(version, false, cp, session)
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

	by, err := bs.GetBundleDef(namespace, version, session)
	if err != nil {
		return nil, err
	}

	r := bundlestore.GetFileReader(func(data io.Writer) error {
		encoder := yaml.NewEncoder(data)
		encoder.SetIndent(2)
		return encoder.Encode(by)
	})

	itemStreams.AddFile("bundle.yaml", "", r)

	return itemStreams, nil

}

// Zip function
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
