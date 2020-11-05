package bundles

import (
	"errors"
	"os"

	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// LoadAll function
func LoadAll(group metadata.BundleableGroup, namespace string, conditions reqs.BundleConditions, session *sess.Session) error {
	version, err := GetVersion(namespace, session)
	if err != nil {
		return errors.New("Failed to LoadAllSite Metadata Item: " + namespace + " - " + err.Error())
	}

	bs, err := bundlestore.GetBundleStore(namespace, session)
	if err != nil {
		return err
	}

	return bs.GetItems(group, namespace, version, conditions, session)
}

// GetAppBundle key
func GetAppBundle(session *sess.Session) (*metadata.BundleDef, error) {

	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()

	entry, ok := localcache.GetCacheEntry("bundle-yaml", appName+":"+appVersion)
	if ok {
		return entry.(*metadata.BundleDef), nil
	}
	bs, err := bundlestore.GetBundleStore(appName, session)
	if err != nil {
		return nil, err
	}
	bundleyaml, err := bs.GetBundleDef(appName, appVersion, session)
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

	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()

	if appName == namespace {
		// We always have a license to our own app.
		return appVersion, nil
	}

	// Check to see if we have a license to use this namespace
	license, err := GetAppLicense(appName, namespace)
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
		return "", errors.New("That version doesn't exist for that bundle: " + appName + " " + appVersion)
	}

	depBundle, hasDep := bundle.Dependencies[namespace]
	if !hasDep {
		return "", errors.New("You don't have that dependency installed: " + namespace)
	}

	return depBundle.Version, nil
}

// Load function
func Load(item metadata.BundleableItem, session *sess.Session) error {

	namespace := item.GetNamespace()
	key := item.GetKey()

	version, err := GetVersion(namespace, session)
	if err != nil {
		return errors.New("Failed to LoadFromSite Metadata Item: " + item.GetCollectionName() + ":" + key + " - " + err.Error())
	}

	bs, err := bundlestore.GetBundleStore(namespace, session)
	if err != nil {
		return err
	}
	return bs.GetItem(item, version, session)
}

// LoadAndHydrateProfile function
func LoadAndHydrateProfile(profileKey string, session *sess.Session) (*metadata.Profile, error) {
	profile, err := metadata.NewProfile(profileKey)
	if err != nil {
		return nil, err
	}
	err = Load(profile, session)
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

		err = Load(permissionSet, session)
		if err != nil {
			logger.Log("Failed Permission Request: "+permissionSetRef+" : "+err.Error(), logger.INFO)
			return nil, err
		}
		profile.PermissionSets = append(profile.PermissionSets, *permissionSet)
	}
	return profile, nil
}

// GetProfilePermSet function
func GetProfilePermSet(session *sess.Session) (*metadata.PermissionSet, error) {
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

// GetFileListFromCache function
func GetFileListFromCache(namespace string, version string, objectName string) ([]string, bool) {
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

// AddFileListToCache function
func AddFileListToCache(namespace string, version string, objectName string, files []string) {
	localcache.SetCacheEntry("file-list", namespace+version+objectName, files)
}

// GetItemFromCache function
func GetItemFromCache(namespace, version, bundleGroupName, name string) (metadata.BundleableItem, bool) {
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
func AddItemToCache(item metadata.BundleableItem, namespace, version string) {
	localcache.SetCacheEntry("bundle-entry", namespace+version+item.GetCollectionName()+item.GetKey(), item)
}
