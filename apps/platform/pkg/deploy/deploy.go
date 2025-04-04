package deploy

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"path"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// TODO: Eliminate the need to keep this manual list.
// Evaluate the dependencies of each item and deploy in dependency order.
var ORDERED_ITEMS = [...]string{
	"fonts",
	"authsources",
	"labels",
	"translations",
	"collections",
	"selectlists",
	"fields",
	"themes",
	"views",
	"routes",
	"routeassignments",
	"files",
	"bots",
	"permissionsets",
	"profiles",
	"componentvariants",
	"componentpacks",
	"components",
	"utilities",
	"useraccesstokens",
	"recordchallengetokens",
	"signupmethods",
	"secrets",
	"configvalues",
	"credentials",
	"integrationtypes",
	"integrations",
	"integrationactions",
	"agents",
}

type DeployOptions struct {
	Upsert     bool
	Connection wire.Connection
	Prefix     string
}

func GenerateToWorkspace(namespace, name string, params map[string]interface{}, connection wire.Connection, session *sess.Session, extraWriter io.Writer) (map[string]interface{}, error) {
	buf := new(bytes.Buffer)
	var zipWriter *zip.Writer
	// If we were requested to return a ZIP file,
	// then we need to write the generated ZIP both to the HTTP response body
	// and to the workspace (via buf), so we need a MultiWriter
	if extraWriter != nil {
		output := types.MultiWriteCloser(extraWriter, buf)
		zipWriter = zip.NewWriter(output)
	} else {
		// Otherwise we just want to generate to the workspace
		zipWriter = zip.NewWriter(buf)
	}
	results, err := datasource.CallGeneratorBot(retrieve.NewWriterCreator(zipWriter.Create), namespace, name, params, connection, session)
	if err != nil {
		zipWriter.Close()
		return nil, err
	}
	if err := zipWriter.Flush(); err != nil {
		return nil, err
	}
	if err := zipWriter.Close(); err != nil {
		return nil, err
	}

	return results, DeployWithOptions(io.NopCloser(buf), session, &DeployOptions{Upsert: true, Connection: connection})

}

func Deploy(body io.ReadCloser, session *sess.Session) error {
	return datasource.WithTransaction(session.RemoveWorkspaceContext(), nil, func(conn wire.Connection) error {
		return DeployWithOptions(body, session, &DeployOptions{
			Connection: conn,
			Upsert:     true,
		})
	})
}

func DeployWithOptions(body io.ReadCloser, session *sess.Session, options *DeployOptions) error {

	if options == nil {
		options = &DeployOptions{Upsert: true, Connection: nil}
	}

	workspace := session.GetWorkspace()
	if workspace == nil {
		return errors.New("No Workspace provided for deployment")
	}

	// Unfortunately, we have to read the whole thing into memory
	bodybytes, err := io.ReadAll(body)
	if err != nil {
		return err
	}

	zipReader, err := zip.NewReader(bytes.NewReader(bodybytes), int64(len(bodybytes)))
	if err != nil {
		return err
	}

	namespace := workspace.GetAppFullName()

	dep := map[string]meta.BundleableGroup{}

	var by *meta.BundleDef

	var uploadOps []*filesource.FileUploadOp
	var readersToClose []io.ReadCloser

	// Make sure we close any ReadClosers that we opened
	defer func() {
		if len(readersToClose) > 0 {
			for _, r := range readersToClose {
				r.Close()
			}
		}
	}()

	// Read all the files from zip archive
	for _, zipFile := range zipReader.File {
		dir, fileName := path.Split(zipFile.Name)
		dirParts := strings.Split(dir, "/")
		partsLength := len(dirParts)

		if options.Prefix != "" && partsLength > 0 {
			prefix, rest := dirParts[0], dirParts[1:]
			if prefix != options.Prefix {
				continue
			}
			dirParts = rest
			partsLength = len(dirParts)
		}

		if fileName == "" || partsLength < 1 {
			continue
		}

		metadataType := dirParts[0]

		if partsLength == 1 && metadataType == "" && fileName == "bundle.yaml" {
			by = &meta.BundleDef{}
			readCloser, err := zipFile.Open()
			if err != nil {
				return err
			}
			readersToClose = append(readersToClose, readCloser)
			if err = bundlestore.DecodeYAML(by, readCloser); err != nil {
				return err
			}
			continue
		}

		// Any files other than bundle.yaml without a metadata type should be ignored
		if metadataType == "" {
			continue
		}

		collection, ok := dep[metadataType]
		if !ok {
			collection, err = meta.GetBundleableGroupFromType(metadataType)
			if err != nil {
				// Most likely found a folder that we don't have a metadata type for
				slog.Info("Found bad metadata type: " + metadataType)
				continue
			}
			dep[metadataType] = collection
		}

		if collection == nil {
			continue
		}

		filePath := path.Join(path.Join(dirParts[1:]...), fileName)

		if !collection.FilterPath(filePath, nil, false) {
			continue
		}

		attachableGroup, isAttachable := collection.(meta.AttachableGroup)

		collectionItem := collection.GetItemFromPath(filePath, namespace)
		if err != nil {
			return err
		}

		if collectionItem == nil {
			continue
		}

		isDefinition := true

		if isAttachable {
			isDefinition = attachableGroup.IsDefinitionPath(filePath)
		}

		if isDefinition {
			if err = collection.AddItem(collectionItem); err != nil {
				return err
			}
			if err = readZipFile(zipFile, collectionItem); err != nil {
				// If this is a typed error, just retain it, rather than wrapping it.
				if exceptions.GetStatusCodeForError(err) < 500 {
					return err
				}
				return exceptions.NewBadRequestException(fmt.Sprintf("Unable to read file '%s'", collectionItem.GetKey()), err)
			}
			continue
		}

		if isAttachable {

			attachableItem, isAttachableItem := collectionItem.(meta.AttachableItem)
			if !isAttachableItem {
				continue
			}

			// If the collection item has a way to get a base path we can use it.
			// Special handling for files and bots that have file data
			f, err := zipFile.Open()
			if err != nil {
				return err
			} else {
				readersToClose = append(readersToClose, f)
			}

			uploadOps = append(uploadOps, &filesource.FileUploadOp{
				Data:            f,
				Path:            strings.TrimPrefix(filePath, attachableItem.GetBasePath()+"/"),
				CollectionID:    collection.GetName(),
				RecordUniqueKey: collectionItem.GetDBID(workspace.UniqueKey),
			})
		}
	}

	var saves []datasource.PlatformSaveRequest

	saveOptions := &wire.SaveOptions{
		Upsert: options.Upsert,
	}

	if by != nil {
		deps := meta.BundleDependencyCollection{}
		for key := range by.Dependencies {
			dep := by.Dependencies[key]
			major, minor, patch, err := meta.ParseVersionString(dep.Version)
			if err != nil {
				return err
			}
			deps = append(deps, &meta.BundleDependency{
				Workspace: workspace,
				App: &meta.App{
					BuiltIn: meta.BuiltIn{
						UniqueKey: key,
					},
				},
				Bundle: &meta.Bundle{
					BuiltIn: meta.BuiltIn{
						UniqueKey: strings.Join([]string{key, major, minor, patch}, ":"),
					},
				},
			})
		}

		// Upload workspace properties like homeRoute and loginRoute
		workspaceItem := &meta.Workspace{
			BuiltIn: meta.BuiltIn{
				ID: workspace.ID,
			},
			App: &meta.App{
				BuiltIn: meta.BuiltIn{
					UniqueKey: namespace,
				},
			},
			AppSettings: meta.AppSettings{
				LoginRoute:    by.LoginRoute,
				SignupRoute:   by.SignupRoute,
				HomeRoute:     by.HomeRoute,
				PublicProfile: by.PublicProfile,
				DefaultTheme:  by.DefaultTheme,
				Favicon:       by.Favicon,
			},
		}

		// We set the valid fields here because it's an update, and we don't want
		// to overwrite the other fields
		workspaceItem.SetItemMeta(&meta.ItemMeta{
			ValidFields: map[string]bool{
				commonfields.Id:              true,
				"uesio/studio.loginroute":    true,
				"uesio/studio.signuproute":   true,
				"uesio/studio.homeroute":     true,
				"uesio/studio.publicprofile": true,
				"uesio/studio.defaulttheme":  true,
				"uesio/studio.favicon":       true,
				"uesio/studio.app":           true,
			},
		})

		saves = append(saves,
			*datasource.GetPlatformSaveOneRequest(workspaceItem, nil),
			datasource.PlatformSaveRequest{
				Collection: &deps,
				Options:    saveOptions,
			},
		)
	}

	params := map[string]interface{}{
		"workspaceid":   workspace.ID,
		"workspacename": workspace.Name,
		"app":           namespace,
	}

	for _, element := range ORDERED_ITEMS {
		if dep[element] != nil {
			saves = append(saves, datasource.PlatformSaveRequest{
				Collection: dep[element],
				Options:    saveOptions,
				Params:     params,
			})
		}
	}

	studioSession := session.RemoveWorkspaceContext()
	if err = datasource.PlatformSaves(saves, options.Connection, studioSession); err != nil {
		return err
	}
	if _, err = filesource.Upload(uploadOps, options.Connection, studioSession, params); err != nil {
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
