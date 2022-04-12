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

type FileRecord struct {
	RecordID  string
	FieldName string
}

var OrderedItems = [...]string{"collections", "selectlists", "fields", "themes", "views", "routes", "files", "bots", "permissionsets", "profiles"}

// Deploy func
func Deploy(body []byte, session *sess.Session) error {

	zipReader, err := zip.NewReader(bytes.NewReader(body), int64(len(body)))
	if err != nil {
		return err
	}

	workspace := session.GetWorkspaceID()
	namespace := session.GetWorkspaceApp()

	if workspace == "" {
		return errors.New("No Workspace provided for deployment")
	}

	dep := map[string]meta.BundleableGroup{}

	fileStreams := []bundlestore.ReadItemStream{}
	// Maps a filename to a recordID
	fileNameMap := map[string]FileRecord{}

	by := meta.BundleDef{}

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
			readCloser, err := zipFile.Open()
			if err != nil {
				return err
			}
			err = bundlestore.DecodeYAML(&by, readCloser)
			readCloser.Close()
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

		key, err := collection.GetKeyFromPath(path, namespace, nil)
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
				fileNameMap[collection.GetName()+":"+file.GetFilePath()] = FileRecord{
					RecordID:  file.Name,
					FieldName: "uesio/studio.content",
				}
			}

			// Special handling for bots
			if metadataType == "bots" {
				bot := collectionItem.(*meta.Bot)
				fileNameMap[collection.GetName()+":"+bot.GetBotFilePath()] = FileRecord{
					RecordID:  bot.CollectionRef + "_" + bot.Type + "_" + bot.Name,
					FieldName: "uesio/studio.content",
				}
			}

			// Special handling for componentpacks
			if metadataType == "componentpacks" {
				cpack := collectionItem.(*meta.ComponentPack)
				fileNameMap[collection.GetName()+":"+cpack.GetComponentPackFilePath(false)] = FileRecord{
					RecordID:  cpack.Name,
					FieldName: "uesio/studio.runtimebundle",
				}
				fileNameMap[collection.GetName()+":"+cpack.GetComponentPackFilePath(true)] = FileRecord{
					RecordID:  cpack.Name,
					FieldName: "uesio/studio.buildtimebundle",
				}
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
			Type:     collection.GetName(),
			FileName: fileName,
			Path:     path,
			Data:     f,
		})
		defer f.Close()
	}

	deps := meta.BundleDependencyCollection{}
	for key := range by.Dependencies {
		dep := by.Dependencies[key]
		deps = append(deps, meta.BundleDependency{
			Workspace: &meta.Workspace{
				ID: workspace,
			},
			App: &meta.App{
				ID: key,
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
			adapt.ID_FIELD:                true,
			"uesio/studio.loginroute":     true,
			"uesio/studio.homeroute":      true,
			"uesio/studio.defaultprofile": true,
			"uesio/studio.publicprofile":  true,
			"uesio/studio.defaulttheme":   true,
		},
	})

	upsertOptions := &adapt.SaveOptions{
		Upsert: &adapt.UpsertOptions{},
	}

	saves := []datasource.PlatformSaveRequest{
		*datasource.GetPlatformSaveOneRequest(workspaceItem, nil),
		{
			Collection: &deps,
			Options:    upsertOptions,
		},
	}

	saves = getSaveRequestsInOrder(saves, dep, upsertOptions)

	connection, err := datasource.GetPlatformConnection(session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}

	err = connection.BeginTransaction()
	if err != nil {
		return err
	}

	err = applyDeploy(saves, fileStreams, fileNameMap, connection, session)
	if err != nil {
		rollbackError := connection.RollbackTransaction()
		if rollbackError != nil {
			return rollbackError
		}
		return err
	}

	err = connection.CommitTransaction()
	if err != nil {
		return err
	}

	// Clear out the bundle definition cache
	bundle.ClearAppBundleCache(session)

	return nil

}

func applyDeploy(
	saves []datasource.PlatformSaveRequest,
	fileStreams []bundlestore.ReadItemStream,
	fileNameMap map[string]FileRecord,
	connection adapt.Connection,
	session *sess.Session,
) error {
	err := datasource.PlatformSaves(saves, connection, session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}

	// Read the filestreams
	for _, fileStream := range fileStreams {

		fileRecord, ok := fileNameMap[fileStream.Type+":"+fileStream.Path]
		if !ok {
			continue
		}

		_, err := filesource.Upload(fileStream.Data, fileadapt.FileDetails{
			Name:         fileStream.FileName,
			CollectionID: fileStream.Type,
			RecordID:     session.GetWorkspaceID() + "_" + fileRecord.RecordID,
			FieldID:      fileRecord.FieldName,
		}, connection, session.RemoveWorkspaceContext())
		if err != nil {
			return err
		}
	}
	return nil
}

func readZipFile(zf *zip.File, item meta.BundleableItem) error {
	f, err := zf.Open()
	if err != nil {
		return err
	}
	defer f.Close()
	return yaml.NewDecoder(f).Decode(item)
}

func getSaveRequestsInOrder(saves []datasource.PlatformSaveRequest, dep map[string]meta.BundleableGroup, upsertOptions *adapt.SaveOptions) []datasource.PlatformSaveRequest {
	for _, element := range OrderedItems {
		if dep[element] != nil {
			saves = append(saves, datasource.PlatformSaveRequest{
				Collection: dep[element],
				Options:    upsertOptions,
			})
		}
	}
	return saves
}
