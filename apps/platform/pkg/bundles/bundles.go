package bundles

import (
	"bufio"
	"errors"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"os"
	"strings"

	"github.com/icza/session"
	"github.com/jinzhu/copier"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"gopkg.in/yaml.v3"
)

func decodeYAML(v interface{}, reader *bufio.Reader) error {
	decoder := yaml.NewDecoder(reader)
	err := decoder.Decode(v)
	if err != nil {
		return err
	}

	return nil
}

// MetadataLoadItem function
func MetadataLoadItem(item metadata.BundleableItem, namespace, version, key string) error {
	if !strings.HasSuffix(key, ".yaml") {
		key = key + ".yaml"
	}
	collectionName := item.GetCollectionName()
	retrievedItem, ok := getFromCache(namespace, version, collectionName, key)
	if !ok {
		reader, closer, err := bundlestore.GetBundleStoreByNamespace(namespace).GetItem(namespace, version, item.GetCollectionName(), key)
		if err != nil {
			return err
		}
		defer closer.Close()
		err = decodeYAML(item, reader)
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
func MetadataLoadGroup(group metadata.BundleableGroup, permSet *metadata.PermissionSet, namespace string, version string) error {
	bundleGroupName := group.GetName()
	keys, ok := getFileListFromCache(namespace, version, bundleGroupName)
	var err error
	if !ok {
		keys, err = bundlestore.GetBundleStoreByNamespace(namespace).ListItems(namespace, version, bundleGroupName)
		if err != nil {
			return err
		}
		addListToCache(namespace, version, bundleGroupName, keys)
	}

	for _, key := range keys {
		retrievedItem := group.NewItem()
		err = MetadataLoadItem(retrievedItem, namespace, version, key)
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
func LoadAll(group metadata.BundleableGroup, namespace string, site *metadata.Site, sess *session.Session) error {
	version, err := GetVersionFromSite(namespace, site)
	if err != nil {
		return errors.New("Failed to Load Metadata Item: " + namespace + " - " + err.Error())
	}

	permSet, err := getProfilePermSet(site, sess)
	if err != nil {
		return err
	}

	err = MetadataLoadGroup(group, permSet, namespace, version)
	if err != nil {
		return err
	}

	return nil
}

func GetBundleYaml(name string, version string) (*metadata.BundleYaml, error) {
	var by metadata.BundleYaml
	bundleStore := bundlestore.GetBundleStoreByNamespace(name)
	reader, closer, err := bundleStore.GetItem(name, version, "", "bundle.yaml")
	if err != nil {
		return nil, err
	}
	defer closer.Close()

	err = decodeYAML(&by, reader)
	if err != nil {
		return nil, err
	}
	return &by, nil
}

// GetAppBundle key
func GetAppBundle(appName, appVersion string) (*metadata.BundleYaml, error) {
	entry, ok := localcache.GetCacheEntry("bundle-yaml", appName+":"+appVersion)
	if ok {
		return entry.(*metadata.BundleYaml), nil
	}
	bundleyaml, err := GetBundleYaml(appName, appVersion)
	if err != nil {
		return nil, err
	}
	if bundleyaml == nil {
		return nil, errors.New("No bundleyaml found for app: " + appName + " with version:" + appVersion)
	}
	localcache.SetCacheEntry("bundle-yaml", appName+":"+appVersion, bundleyaml)
	return bundleyaml, nil
}

// GetVersionFromSite function
func GetVersionFromSite(namespace string, site *metadata.Site) (string, error) {

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

	bundle, err := GetAppBundle(site.AppRef, site.VersionRef)
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
func Load(item metadata.BundleableItem, site *metadata.Site, sess *session.Session) error {
	namespace := item.GetNamespace()
	key := item.GetKey()

	version, err := GetVersionFromSite(namespace, site)
	if err != nil {
		return errors.New("Failed to Load Metadata Item: " + key + " - " + err.Error())
	}

	// Now Check to make sure we can actually view this item
	hasPermission := SessionHasPermission(
		site,
		sess,
		item.GetPermChecker(),
	)

	if !hasPermission {
		return errors.New("You don't have permission to that file: " + key)
	}

	return MetadataLoadItem(item, namespace, version, key)
}

// LoadAndHydrateProfile function
func LoadAndHydrateProfile(profileKey string, site *metadata.Site, sess *session.Session) (*metadata.Profile, error) {
	// TODO: This should happen in the authentication middleware and only be done once per request
	// Right now it's happening a lot. On pretty much every metadata request
	profile, err := metadata.NewProfile(profileKey)
	if err != nil {
		return nil, err
	}
	err = Load(profile, site, sess)
	if err != nil {
		logger.Log("Failed Permission Request: "+profileKey+" : "+err.Error(), logger.INFO)
		return nil, err
	}
	// Load in the permission sets for this profile
	for _, permissionSetRef := range profile.PermissionSetRefs {

		permissionSet, err := metadata.NewPermissionSet(permissionSetRef)
		if err != nil {
			return nil, err
		}

		err = Load(permissionSet, site, sess)
		if err != nil {
			logger.Log("Failed Permission Request: "+permissionSetRef+" : "+err.Error(), logger.INFO)
			return nil, err
		}
		profile.PermissionSets = append(profile.PermissionSets, *permissionSet)
	}
	return profile, nil
}

// ProfileHasPermission returns whether a profile has permission
func ProfileHasPermission(profileKey string, site *metadata.Site, sess *session.Session, check *metadata.PermissionSet) bool {
	profile, err := LoadAndHydrateProfile(profileKey, site, sess)
	if err != nil {
		return false
	}
	return profile.HasPermission(check)
}

func getProfilePermSet(site *metadata.Site, sess *session.Session) (*metadata.PermissionSet, error) {
	profileKey, err := getProfileKey(sess)
	if err != nil {
		return nil, err
	}
	profile, err := LoadAndHydrateProfile(profileKey, site, sess)
	if err != nil {
		return nil, err
	}

	return profile.FlattenPermissions(), nil
}

// getProfileKey function
func getProfileKey(sess *session.Session) (string, error) {
	profile := (*sess).CAttr("Profile").(string)
	if profile == "" {
		return "", errors.New("No profile found in session")
	}
	return profile, nil
}

// SessionHasPermission returns whether a session has permission
func SessionHasPermission(site *metadata.Site, sess *session.Session, check *metadata.PermissionSet) bool {
	if check == nil {
		return true
	}
	profileKey, err := getProfileKey(sess)
	if err != nil {
		return false
	}
	return ProfileHasPermission(profileKey, site, sess, check)
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
