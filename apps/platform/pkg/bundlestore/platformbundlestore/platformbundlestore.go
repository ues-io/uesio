package platformbundlestore

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/systembundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var doCache bool

// Bundle entries here should be fairly long-lived because (a) bundles are immutable (b) the cost of retrieval is high.
var bundleStoreCache *bundle.BundleStoreCache

func init() {
	// on by default
	doCache = os.Getenv("UESIO_CACHE_SITE_BUNDLES") != "false"
	if doCache {
		bundleStoreCache = bundle.NewBundleStoreCache(4*time.Hour, 15*time.Minute)
	}
}

type PlatformBundleStore struct{}

func (b *PlatformBundleStore) GetConnection(options bundlestore.ConnectionOptions) (bundlestore.BundleStoreConnection, error) {
	return &PlatformBundleStoreConnection{
		ConnectionOptions: options,
	}, nil
}

type PlatformBundleStoreConnection struct {
	bundlestore.ConnectionOptions
	studioAnonSession *sess.Session
	fileConnection    file.Connection
}

// cache this so that we don't double-create them so much
func (b *PlatformBundleStoreConnection) getStudioAnonSession() *sess.Session {
	if b.studioAnonSession == nil {
		b.studioAnonSession = sess.GetStudioAnonSession(b.Context)
	}
	return b.studioAnonSession
}

func (b *PlatformBundleStoreConnection) getPlatformFileConnection() (file.Connection, error) {
	if b.fileConnection == nil {
		fileConnection, err := fileadapt.GetFileConnection("uesio/core.bundlestore", b.getStudioAnonSession())
		if err != nil {
			return nil, err
		} else {
			b.fileConnection = fileConnection
		}
	}
	return b.fileConnection, nil
}

func getBasePath(namespace, version string) string {
	return filepath.Join(namespace, version, "bundle")
}

func (b *PlatformBundleStoreConnection) download(w io.Writer, path string) (file.Metadata, error) {
	conn, err := b.getPlatformFileConnection()
	if err != nil {
		return nil, err
	}
	return conn.Download(w, path)
}

func (b *PlatformBundleStoreConnection) GetItem(item meta.BundleableItem, options *bundlestore.GetItemOptions) error {
	key := item.GetKey()
	fullCollectionName := item.GetCollectionName()
	collectionName := item.GetBundleFolderName()

	hasPermission := b.Permissions.HasPermission(item.GetPermChecker())
	if !hasPermission {
		message := fmt.Sprintf("No Permission to metadata item: %s : %s", item.GetCollectionName(), key)
		return exceptions.NewForbiddenException(message)
	}

	if doCache {
		cachedItem, ok := bundleStoreCache.GetItemFromCache(b.Namespace, b.Version, fullCollectionName, key)
		if ok {
			if !b.AllowPrivate && !cachedItem.IsPublic() {
				return exceptions.NewForbiddenException("Metadata item: " + key + " is not public")
			}
			return meta.Copy(item, cachedItem)
		}
	}

	buf := &bytes.Buffer{}
	fileMetadata, err := b.download(buf, filepath.Join(getBasePath(b.Namespace, b.Version), collectionName, item.GetPath()))
	if err != nil {
		return exceptions.NewNotFoundException("Metadata item: " + key + " does not exist")
	}
	item.SetModified(*fileMetadata.LastModified())
	err = bundlestore.DecodeYAML(item, buf)
	if err != nil {
		return err
	}
	if !b.AllowPrivate && !item.IsPublic() {
		return exceptions.NewForbiddenException("Metadata item: " + key + " is not public")
	}
	if !doCache {
		return nil
	}
	return bundleStoreCache.AddItemToCache(b.Namespace, b.Version, fullCollectionName, key, item)
}

func (b *PlatformBundleStoreConnection) HasAny(group meta.BundleableGroup, options *bundlestore.HasAnyOptions) (bool, error) {
	if options == nil {
		options = &bundlestore.HasAnyOptions{}
	}
	err := b.GetAllItems(group, &bundlestore.GetAllItemsOptions{
		Conditions: options.Conditions,
	})
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *PlatformBundleStoreConnection) GetManyItems(items []meta.BundleableItem, options *bundlestore.GetManyItemsOptions) error {
	if options == nil {
		options = &bundlestore.GetManyItemsOptions{}
	}
	for _, item := range items {
		err := b.GetItem(item, nil)
		if err != nil {
			if options.AllowMissingItems {
				switch err.(type) {
				case *exceptions.ForbiddenException:
					continue
				}
			}
			return err
		}
	}
	return nil
}

func (b *PlatformBundleStoreConnection) GetAllItems(group meta.BundleableGroup, options *bundlestore.GetAllItemsOptions) error {
	if options == nil {
		options = &bundlestore.GetAllItemsOptions{}
	}
	// TODO: Think about caching this, but remember conditions
	basePath := filepath.Join(getBasePath(b.Namespace, b.Version), group.GetBundleFolderName()) + "/"
	conn, err := b.getPlatformFileConnection()
	if err != nil {
		return err
	}
	paths, err := systembundlestore.GetFilePaths(basePath, group.FilterPath, options.Conditions, conn)
	if err != nil {
		return err
	}

	for _, path := range paths {

		retrievedItem := group.GetItemFromPath(path, b.Namespace)
		if retrievedItem == nil {
			continue
		}

		// TODO: Shouldn't we return these errors?
		if err = b.GetItem(retrievedItem, nil); err != nil {
			switch err.(type) {
			case *exceptions.NotFoundException, *exceptions.ForbiddenException:
				continue
			default:
				return err
			}
		}

		// Check to see if the item meets bundle conditions
		// which are not associated with the Item's filesystem path
		if bundlestore.DoesItemMeetBundleConditions(retrievedItem, options.Conditions) {
			group.AddItem(retrievedItem)
		}
	}

	return nil

}

func (b *PlatformBundleStoreConnection) GetItemAttachment(w io.Writer, item meta.AttachableItem, path string) (file.Metadata, error) {
	return b.download(w, filepath.Join(getBasePath(item.GetNamespace(), b.Version), item.GetBundleFolderName(), filepath.Join(item.GetBasePath(), path)))
}

func (b *PlatformBundleStoreConnection) GetItemAttachments(creator bundlestore.FileCreator, item meta.AttachableItem) error {
	// Get all the file paths for this attachable item
	basePath := filepath.Join(getBasePath(item.GetNamespace(), b.Version), item.GetBundleFolderName(), item.GetBasePath())
	conn, err := b.getPlatformFileConnection()
	if err != nil {
		return err
	}
	// Add condition here so that our cache key contains it
	filterConditions := map[string]interface{}{"attachments": "yes"}
	originalFilter := item.GetCollection().(meta.BundleableGroup)
	filter := func(s string, bc meta.BundleConditions, b bool) bool {
		// We want all files that *aren't* the definition file
		return !originalFilter.FilterPath(filepath.Join(item.GetBasePath(), s), nil, true)
	}
	paths, err := systembundlestore.GetFilePaths(basePath, filter, filterConditions, conn)
	if err != nil {
		return err
	}
	for _, path := range paths {
		f, err := creator(path)
		if err != nil {
			return err
		}
		_, err = conn.Download(f, filepath.Join(basePath, path))
		if err != nil {
			f.Close()
			return err
		}
		f.Close()
	}
	return nil
}

func (b *PlatformBundleStoreConnection) StoreItem(path string, reader io.Reader) error {

	fullFilePath := filepath.Join(b.Namespace, b.Version, path)

	conn, err := b.getPlatformFileConnection()
	if err != nil {
		return err
	}

	err = conn.Upload(reader, fullFilePath)
	if err != nil {
		return errors.New("Error Writing File: " + err.Error())
	}

	return nil
}

func (b *PlatformBundleStoreConnection) DeleteBundle() error {

	fullFilePath := filepath.Join(b.Namespace, b.Version)

	conn, err := b.getPlatformFileConnection()
	if err != nil {
		return err
	}

	err = conn.EmptyDir(fullFilePath)
	if err != nil {
		return errors.New("Error Deleting Bundle: " + err.Error())
	}

	return nil
}

func (b *PlatformBundleStoreConnection) GetBundleDef() (*meta.BundleDef, error) {
	var by meta.BundleDef
	buf := &bytes.Buffer{}
	_, err := b.download(buf, filepath.Join(getBasePath(b.Namespace, b.Version), "", "bundle.yaml"))
	if err != nil {
		return nil, err
	}

	err = bundlestore.DecodeYAML(&by, buf)
	if err != nil {
		return nil, err
	}
	return &by, nil
}

func (b *PlatformBundleStoreConnection) HasAllItems(items []meta.BundleableItem) error {
	for _, item := range items {
		err := b.GetItem(item, nil)
		if err != nil {
			return err
		}
	}
	return nil
}

func (b *PlatformBundleStoreConnection) SetBundleZip(reader io.ReaderAt, size int64) error {

	// Create a zip reader from the zip file content
	zipReader, err := zip.NewReader(reader, size)
	if err != nil {
		return err
	}

	// Iterate over the zip files
	for _, zipFile := range zipReader.File {
		rc, err := zipFile.Open()
		if err != nil {
			return err
		}
		defer rc.Close()

		err = b.StoreItem(zipFile.Name, rc)
		if err != nil {
			return err
		}
	}

	return nil

}

func (b *PlatformBundleStoreConnection) GetBundleZip(writer io.Writer, zipoptions *bundlestore.BundleZipOptions) error {

	session := b.getStudioAnonSession()

	app := b.Namespace
	version := b.Version

	if app == "" {
		return errors.New("no app provided for retrieve")
	}

	if version == "" {
		return errors.New("no version provided for retrieve")
	}

	major, minor, patch, err := meta.ParseVersionString(version)
	if err != nil {
		return err
	}

	bundleUniqueKey := strings.Join([]string{app, major, minor, patch}, ":")

	var bundle meta.Bundle
	if err := datasource.PlatformLoadOne(
		&bundle,
		&datasource.PlatformLoadOptions{
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.contents",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.UniqueKey,
					Value: bundleUniqueKey,
				},
			},
		},
		session,
	); err != nil {
		return err
	}

	// For bundles that don't have a contents file saved, we will need to go get each
	// individual item
	if bundle.Contents == nil {
		zipwriter := zip.NewWriter(writer)
		create := retrieve.NewWriterCreator(zipwriter.Create)
		// Retrieve bundle contents
		err = retrieve.RetrieveBundle(retrieve.BundleDirectory, create, b)
		if err != nil {
			return err
		}

		// Return early, don't go download the file because it does not exist.
		return zipwriter.Close()
	}

	if _, err := filesource.Download(writer, bundle.Contents.ID, session); err != nil {
		return err
	}

	return nil
}
