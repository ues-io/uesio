package deploy

import (
	"archive/zip"
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Deploy func
func Deploy(body []byte, session *sess.Session) error {

	zipReader, err := zip.NewReader(bytes.NewReader(body), int64(len(body)))
	if err != nil {
		return err
	}

	workspace := session.GetWorkspaceID()

	if workspace == "" {
		return errors.New("No Workspace provided for deployment")
	}

	dep := map[string]meta.BundleableGroup{}

	fileStreams := []bundlestore.ReadItemStream{}
	// Maps a filename to a recordID
	fileNameMap := map[string]string{}

	// Read all the files from zip archive
	for _, zipFile := range zipReader.File {
		// Don't forget to fix the windows filenames here
		dir, fileName := filepath.Split(zipFile.Name)
		dirParts := strings.Split(dir, string(os.PathSeparator))
		partsLength := len(dirParts)

		if fileName == "" || partsLength < 2 || dirParts[0] != "bundle" {
			continue
		}

		metadataType := dirParts[1]

		if partsLength == 2 && metadataType == "" && fileName == "bundle.yaml" {
			err := addDependencies(workspace, zipFile, session)
			if err != nil {
				return err
			}
			continue
		}

		collection, ok := dep[metadataType]
		if !ok {
			collection, err = meta.GetBundleableGroupFromType(metadataType)
			if err != nil {
				// Most likely found a folder that we don't have a metadata type for
				logger.Log("Found bad metadata type: "+metadataType, logger.INFO)
				continue
			}
			dep[metadataType] = collection
		}

		if collection == nil {
			continue
		}

		path := filepath.Join(filepath.Join(dirParts[2:]...), fileName)

		key, err := collection.GetKeyFromPath(path, nil)
		if err != nil {
			return err
		}

		if key != "" {
			// If key is not blank, then it's a regular metadata item
			collectionItem, err := collection.NewBundleableItemWithKey(key)
			if err != nil {
				return err
			}
			err = readZipFile(zipFile, collectionItem)
			if err != nil {
				return errors.New("Reading File: " + key + " : " + err.Error())
			}

			// Special handling for files
			if metadataType == "files" {
				file := collectionItem.(*meta.File)
				fileNameMap[metadataType+":"+file.GetFilePath()] = file.Name
			}

			// Special handling for bots
			if metadataType == "bots" {
				bot := collectionItem.(*meta.Bot)
				fileNameMap[metadataType+":"+bot.GetBotFilePath()] = bot.CollectionRef + "_" + bot.Type + "_" + bot.Name
			}

			collectionItem.SetWorkspace(workspace)
			continue
		}

		// Special handling for files and bots that have file data
		f, err := zipFile.Open()
		if err != nil {
			return err
		}
		fileStreams = append(fileStreams, bundlestore.ReadItemStream{
			Type:     metadataType,
			FileName: fileName,
			Path:     path,
			Data:     f,
		})
		defer f.Close()
	}

	saves := []datasource.PlatformSaveRequest{}
	for _, collection := range dep {
		length := collection.Len()
		if length > 0 {
			saves = append(saves, datasource.PlatformSaveRequest{
				Collection: collection,
				Options: &adapt.SaveOptions{
					Upsert: &adapt.UpsertOptions{},
				},
			})
		}
	}

	err = datasource.PlatformSaves(saves, session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}

	// Read the filestreams
	for _, fileStream := range fileStreams {

		recordID, ok := fileNameMap[fileStream.Type+":"+fileStream.Path]
		if !ok {
			continue
		}

		_, err := filesource.Upload(fileStream.Data, fileadapt.FileDetails{
			Name:         fileStream.FileName,
			CollectionID: "studio." + fileStream.Type,
			RecordID:     session.GetWorkspaceID() + "_" + recordID,
			FieldID:      "studio.content",
		}, session.RemoveWorkspaceContext())
		if err != nil {
			return err
		}
	}

	// Clear out the bundle definition cache
	bundle.ClearAppBundleCache(session)

	return nil

}

func addDependencies(workspace string, zipFile *zip.File, session *sess.Session) error {
	//Break down bundle.yaml into dependency records
	by := meta.BundleDef{}
	readCloser, err := zipFile.Open()
	if err != nil {
		return err
	}
	err = bundlestore.DecodeYAML(&by, readCloser)
	readCloser.Close()
	if err != nil {
		return err
	}
	deps := meta.BundleDependencyCollection{}
	for key := range by.Dependencies {
		dep := by.Dependencies[key]
		deps = append(deps, meta.BundleDependency{
			Workspace: &meta.Workspace{
				ID: workspace,
			},
			Bundle: &meta.Bundle{
				ID: key + "_" + dep.Version,
			},
		})
	}
	// Upload workspace properties like homeRoute and loginRoute
	workspaceItem := (&meta.Workspace{
		ID:             workspace,
		App:            session.GetSite().App,
		LoginRoute:     by.LoginRoute,
		HomeRoute:      by.HomeRoute,
		DefaultProfile: by.DefaultProfile,
		PublicProfile:  by.PublicProfile,
		DefaultTheme:   by.DefaultTheme,
	})

	// We set the valid fields here because it's an update and we don't want
	// to overwrite the other fields
	workspaceItem.SetItemMeta(&meta.ItemMeta{
		ValidFields: map[string]bool{
			"uesio.id":              true,
			"studio.loginroute":     true,
			"studio.homeroute":      true,
			"studio.defaultprofile": true,
			"studio.publicprofile":  true,
			"studio.defaulttheme":   true,
		},
	})

	err = datasource.PlatformSaveOne(workspaceItem, nil, session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}

	return datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &deps,
		Options: &adapt.SaveOptions{
			Upsert: &adapt.UpsertOptions{},
		},
	}, session.RemoveWorkspaceContext())
}

func readZipFile(zf *zip.File, item meta.BundleableItem) error {
	f, err := zf.Open()
	if err != nil {
		return err
	}
	defer f.Close()
	return yaml.NewDecoder(f).Decode(item)
}
