package deploy

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

type FileRecord struct {
	RecordUniqueKey string
	FieldName       string
}

var ORDERED_ITEMS = [...]string{
	"collections",
	"selectlists",
	"fields",
	"themes",
	"views",
	"routes",
	"files",
	"bots",
	"permissionsets",
	"profiles",
	"componentvariants",
	"componentpacks",
	"labels",
	"translations",
	"useraccesstokens",
	"signupmethods",
	"secrets",
	"credentials",
	"integrations",
}

func Deploy(body io.ReadCloser, session *sess.Session) error {

	workspace := session.GetWorkspace()
	if workspace == nil {
		return errors.New("No Workspace provided for deployment")
	}

	// Unfortunately, we have to read the whole thing into memory
	bodybytes, err := ioutil.ReadAll(body)
	if err != nil {
		return err
	}

	zipReader, err := zip.NewReader(bytes.NewReader(bodybytes), int64(len(bodybytes)))
	if err != nil {
		return err
	}

	namespace := workspace.GetAppFullName()

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

		if fileName == "" || partsLength < 1 {
			continue
		}

		metadataType := dirParts[0]

		if partsLength == 1 && metadataType == "" && fileName == "bundle.yaml" {
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

		path := filepath.Join(filepath.Join(dirParts[1:]...), fileName)

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
			collection.AddItem(collectionItem)
			collectionItem.SetNamespace(namespace)
			err = readZipFile(zipFile, collectionItem)
			if err != nil {
				return errors.New("Reading File: " + key + " : " + err.Error())
			}

			// Special handling for files
			if metadataType == "files" {
				file := collectionItem.(*meta.File)
				fileNameMap[collection.GetName()+":"+file.GetFilePath()] = FileRecord{
					RecordUniqueKey: file.GetDBID(workspace.UniqueKey),
					FieldName:       "uesio/studio.content",
				}
			}

			// Special handling for bots
			if metadataType == "bots" {
				bot := collectionItem.(*meta.Bot)
				fileNameMap[collection.GetName()+":"+bot.GetBotFilePath()] = FileRecord{
					RecordUniqueKey: bot.GetDBID(workspace.UniqueKey),
					FieldName:       "uesio/studio.content",
				}
			}

			// Special handling for componentpacks
			if metadataType == "componentpacks" {
				cpack := collectionItem.(*meta.ComponentPack)
				fileNameMap[collection.GetName()+":"+cpack.GetComponentPackFilePath(false)] = FileRecord{
					RecordUniqueKey: cpack.GetDBID(workspace.UniqueKey),
					FieldName:       "uesio/studio.runtimebundle",
				}
				fileNameMap[collection.GetName()+":"+cpack.GetComponentPackFilePath(true)] = FileRecord{
					RecordUniqueKey: cpack.GetDBID(workspace.UniqueKey),
					FieldName:       "uesio/studio.buildtimebundle",
				}
			}

			collectionItem.SetField("uesio/studio.workspace", &meta.Workspace{
				ID: workspace.ID,
			})

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

	uploadOps := []filesource.FileUploadOp{}

	for _, fileStream := range fileStreams {
		fileRecord, ok := fileNameMap[fileStream.Type+":"+fileStream.Path]
		if !ok {
			continue
		}
		uploadOps = append(uploadOps, filesource.FileUploadOp{
			Data: fileStream.Data,
			Details: &fileadapt.FileDetails{
				Name:            fileStream.FileName,
				CollectionID:    fileStream.Type,
				RecordUniqueKey: fileRecord.RecordUniqueKey,
				FieldID:         fileRecord.FieldName,
			},
		})
	}

	deps := meta.BundleDependencyCollection{}
	for key := range by.Dependencies {
		dep := by.Dependencies[key]
		major, minor, patch, err := meta.ParseVersionString(dep.Version)
		if err != nil {
			return err
		}
		deps = append(deps, &meta.BundleDependency{
			Workspace: &meta.Workspace{
				ID: workspace.ID,
			},
			App: &meta.App{
				UniqueKey: key,
			},
			Bundle: &meta.Bundle{
				UniqueKey: strings.Join([]string{key, major, minor, patch}, ":"),
			},
		})
	}

	// Upload workspace properties like homeRoute and loginRoute
	workspaceItem := (&meta.Workspace{
		ID: workspace.ID,
		App: &meta.App{
			UniqueKey: namespace,
		},
		LoginRoute:    by.LoginRoute,
		HomeRoute:     by.HomeRoute,
		PublicProfile: by.PublicProfile,
		DefaultTheme:  by.DefaultTheme,
	})

	// We set the valid fields here because it's an update and we don't want
	// to overwrite the other fields
	workspaceItem.SetItemMeta(&meta.ItemMeta{
		ValidFields: map[string]bool{
			adapt.ID_FIELD:               true,
			"uesio/studio.loginroute":    true,
			"uesio/studio.homeroute":     true,
			"uesio/studio.publicprofile": true,
			"uesio/studio.defaulttheme":  true,
			"uesio/studio.app":           true,
		},
	})

	saveOptions := &adapt.SaveOptions{
		Upsert: true,
	}

	saves := []datasource.PlatformSaveRequest{
		*datasource.GetPlatformSaveOneRequest(workspaceItem, nil),
		{
			Collection: &deps,
			Options:    saveOptions,
		},
	}

	for _, element := range ORDERED_ITEMS {
		if dep[element] != nil {
			saves = append(saves, datasource.PlatformSaveRequest{
				Collection: dep[element],
				Options:    saveOptions,
			})
		}
	}

	connection, err := datasource.GetPlatformConnection(session.RemoveWorkspaceContext(), nil)
	if err != nil {
		return err
	}

	err = connection.BeginTransaction()
	if err != nil {
		return err
	}

	err = applyDeploy(saves, uploadOps, connection, session)
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
	fileops []filesource.FileUploadOp,
	connection adapt.Connection,
	session *sess.Session,
) error {
	err := datasource.PlatformSaves(saves, connection, session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}

	_, err = filesource.Upload(fileops, connection, session.RemoveWorkspaceContext())
	if err != nil {
		return err
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
