package bundles

import (
	"errors"
	"os"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/jinzhu/copier"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// MetadataLoadItem function
func MetadataLoadItem(item metadata.BundleableItem, namespace, version, key string, session *sess.Session) error {
	if !strings.HasSuffix(key, ".yaml") {
		key = key + ".yaml"
	}
	collectionName := item.GetCollectionName()
	retrievedItem, ok := getFromCache(namespace, version, collectionName, key)
	if !ok {
		bs, err := bundlestore.GetBundleStore(namespace, session)
		if err != nil {
			return err
		}
		stream, err := bs.GetItem(namespace, version, item.GetCollectionName(), key)
		if err != nil {
			return err
		}
		defer stream.Close()
		err = bundlestore.DecodeYAML(item, stream)
		if err != nil {
			return err
		}
		item.SetNamespace(namespace)
		addItemToCache(item, namespace, version)
	} else {
		err := copier.Copy(item, retrievedItem)
		if err != nil {
			return err
		}
	}

	return nil
}

// MetadataLoadGroup function
func MetadataLoadGroup(group metadata.BundleableGroup, permSet *metadata.PermissionSet, namespace string, version string, session *sess.Session) error {
	bundleGroupName := group.GetName()
	keys, ok := getFileListFromCache(namespace, version, bundleGroupName)
	var err error
	if !ok {
		bs, err := bundlestore.GetBundleStore(namespace, session)
		if err != nil {
			return err
		}
		keys, err = bs.ListItems(namespace, version, bundleGroupName)
		if err != nil {
			return err
		}
		addListToCache(namespace, version, bundleGroupName, keys)
	}

	for _, key := range keys {
		retrievedItem := group.NewItem()
		err = MetadataLoadItem(retrievedItem, namespace, version, key, session)
		if err != nil {
			return err
		}
		hasPermission := permSet.HasPermission(retrievedItem.GetPermChecker())
		if !hasPermission {
			continue
		}
		group.AddItem(retrievedItem)
	}
	return nil
}

// LoadAll function
func LoadAll(group metadata.BundleableGroup, namespace string, version string, session *sess.Session) error {
	permSet, err := getProfilePermSet(session)
	if err != nil {
		return err
	}

	err = MetadataLoadGroup(group, permSet, namespace, version, session)
	if err != nil {
		return err
	}

	return nil
}

// LoadAllSite function
func LoadAllSite(group metadata.BundleableGroup, namespace string, session *sess.Session) error {
	version, err := GetVersion(namespace, session)
	if err != nil {
		return errors.New("Failed to LoadFromSite Metadata Item: " + namespace + " - " + err.Error())
	}
	return LoadAll(group, namespace, version, session)
}

// GetBundleDef function
func GetBundleDef(session *sess.Session) (*metadata.BundleDef, error) {
	site := session.GetSite()
	name := site.AppRef
	version := site.VersionRef
	var by metadata.BundleDef
	bundleStore, err := bundlestore.GetBundleStore(name, session)
	if err != nil {
		return nil, err
	}
	stream, err := bundleStore.GetItem(name, version, "", "bundle.yaml")
	if err != nil {
		return nil, err
	}
	defer stream.Close()

	err = bundlestore.DecodeYAML(&by, stream)
	if err != nil {
		return nil, err
	}
	return &by, nil
}

// GetAppBundle key
func GetAppBundle(session *sess.Session) (*metadata.BundleDef, error) {

	site := session.GetSite()
	appName := site.AppRef
	appVersion := site.VersionRef
	entry, ok := localcache.GetCacheEntry("bundle-yaml", appName+":"+appVersion)
	if ok {
		return entry.(*metadata.BundleDef), nil
	}
	bundleyaml, err := GetBundleDef(session)
	if err != nil {
		return nil, err
	}
	if bundleyaml == nil {
		return nil, errors.New("No bundleyaml found for app: " + appName + " with version:" + appVersion)
	}
	localcache.SetCacheEntry("bundle-yaml", appName+":"+appVersion, bundleyaml)
	return bundleyaml, nil
}

// GetVersion function
func GetVersion(namespace string, session *sess.Session) (string, error) {

	site := session.GetSite()
	// Get the site's version
	if site.AppRef == namespace {
		// We always have a license to our own app.
		return site.VersionRef, nil
	}

	// Check to see if we have a license to use this namespace
	license, err := GetAppLicense(site.AppRef, namespace)
	if err != nil {
		return "", err
	}

	if license == nil {
		return "", errors.New("You aren't licensed to use that app: " + namespace)
	}

	bundle, err := GetAppBundle(session)
	if err != nil {
		return "", err
	}

	if bundle == nil {
		return "", errors.New("That version doesn't exist for that bundle: " + site.AppRef + " " + site.VersionRef)
	}

	depBundle, hasDep := bundle.Dependencies[namespace]
	if !hasDep {
		return "", errors.New("You don't have that dependency installed: " + namespace)
	}

	return depBundle.Version, nil
}

// Load function
func Load(item metadata.BundleableItem, version string, session *sess.Session) error {
	namespace := item.GetNamespace()
	key := item.GetKey()
	// Now Check to make sure we can actually view this item
	hasPermission := SessionHasPermission(
		session,
		item.GetPermChecker(),
	)

	if !hasPermission {
		return errors.New("You don't have permission to that file: " + key)
	}

	return MetadataLoadItem(item, namespace, version, key, session)
}

// LoadFromSite function
func LoadFromSite(item metadata.BundleableItem, session *sess.Session) error {
	namespace := item.GetNamespace()

	version, err := GetVersion(namespace, session)
	if err != nil {
		return errors.New("Failed to LoadFromSite Metadata Item: " + item.GetKey() + " - " + err.Error())
	}
	return Load(item, version, session)

}

// LoadAndHydrateProfile function
func LoadAndHydrateProfile(profileKey string, session *sess.Session) (*metadata.Profile, error) {
	// TODO: This should happen in the authentication middleware and only be done once per request
	// Right now it's happening a lot. On pretty much every metadata request
	profile, err := metadata.NewProfile(profileKey)
	if err != nil {
		return nil, err
	}
	err = LoadFromSite(profile, session)
	if err != nil {
		logger.Log("Failed Permission Request: "+profileKey+" : "+err.Error(), logger.INFO)
		return nil, err
	}
	// LoadFromSite in the permission sets for this profile
	for _, permissionSetRef := range profile.PermissionSetRefs {

		permissionSet, err := metadata.NewPermissionSet(permissionSetRef)
		if err != nil {
			return nil, err
		}

		err = LoadFromSite(permissionSet, session)
		if err != nil {
			logger.Log("Failed Permission Request: "+permissionSetRef+" : "+err.Error(), logger.INFO)
			return nil, err
		}
		profile.PermissionSets = append(profile.PermissionSets, *permissionSet)
	}
	return profile, nil
}

// ProfileHasPermission returns whether a profile has permission
func ProfileHasPermission(profileKey string, session *sess.Session, check *metadata.PermissionSet) bool {
	profile, err := LoadAndHydrateProfile(profileKey, session)
	if err != nil {
		return false
	}
	return profile.HasPermission(check)
}

func getProfilePermSet(session *sess.Session) (*metadata.PermissionSet, error) {
	profileKey, err := getProfileKey(session)
	if err != nil {
		return nil, err
	}
	profile, err := LoadAndHydrateProfile(profileKey, session)
	if err != nil {
		return nil, err
	}

	return profile.FlattenPermissions(), nil
}

// getProfileKey function
func getProfileKey(session *sess.Session) (string, error) {
	profile := session.GetProfile()
	if profile == "" {
		return "", errors.New("No profile found in session")
	}
	return profile, nil
}

// SessionHasPermission returns whether a session has permission
func SessionHasPermission(session *sess.Session, check *metadata.PermissionSet) bool {
	if check == nil {
		return true
	}
	profileKey, err := getProfileKey(session)
	if err != nil {
		return false
	}
	return ProfileHasPermission(profileKey, session, check)
}

func getFileListFromCache(namespace string, version string, objectName string) ([]string, bool) {
	if os.Getenv("GAE_ENV") == "" {
		// For Local dev, don't use the cache so we can make lots of changes all the time
		return nil, false
	}

	files, ok := localcache.GetCacheEntry("file-list", namespace+version+objectName)
	if ok {
		return files.([]string), ok
	}
	return nil, false
}
func addListToCache(namespace string, version string, objectName string, files []string) {
	localcache.SetCacheEntry("file-list", namespace+version+objectName, files)
}
func getFromCache(namespace, version, bundleGroupName, name string) (metadata.BundleableItem, bool) {
	// If we're not in app engine, do not use the cache
	if os.Getenv("GAE_ENV") == "" {
		// For Local dev, don't use the cache so we can make lots of changes all the time
		return nil, false
	}
	entry, ok := localcache.GetCacheEntry("bundle-entry", namespace+version+bundleGroupName+name)
	if ok {
		return entry.(metadata.BundleableItem), ok
	}
	return nil, ok
}

// AddItemToCache function
func addItemToCache(item metadata.BundleableItem, namespace, version string) {
	localcache.SetCacheEntry("bundle-entry", namespace+version+item.GetCollectionName()+item.GetKey(), item)
}
