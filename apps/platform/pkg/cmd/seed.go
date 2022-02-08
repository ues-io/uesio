package cmd

import (
	"bufio"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"time"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/systembundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func init() {

	RootCmd.AddCommand(&cobra.Command{
		Use:   "seed",
		Short: "Seed Database",
		Run:   seed,
	})

}

func getSeedDataFile(v interface{}, fileName string) error {
	filePath := filepath.Join("seed", fileName)
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()
	reader := bufio.NewReader(file)
	decoder := json.NewDecoder(reader)
	return decoder.Decode(v)
}

func getPlatformSeedSR(collection meta.CollectionableGroup) datasource.SaveRequest {
	return datasource.GetSaveRequestFromPlatformSave(datasource.PlatformSaveRequest{
		Collection: collection,
		Options: &adapt.SaveOptions{
			Upsert: &adapt.UpsertOptions{},
		},
	})
}

func getSeedSR(collectionName string, collection *adapt.Collection) datasource.SaveRequest {
	return datasource.SaveRequest{
		Collection: collectionName,
		Wire:       collectionName,
		Changes:    collection,
		Options: &adapt.SaveOptions{
			Upsert: &adapt.UpsertOptions{},
		},
	}
}

func populateSeedData(collections ...meta.CollectionableGroup) error {
	for i := range collections {
		err := getSeedDataFile(collections[i], collections[i].GetName()+".json")
		if err != nil {
			return err
		}
	}
	return nil
}

func installBundles(session *sess.Session, bundleNames ...string) error {
	sysbs := &systembundlestore.SystemBundleStore{}

	for _, bundleName := range bundleNames {
		err := datasource.CreateBundle(bundleName, "v0.0.1", "v0.0.1", "Seed Install: "+bundleName, sysbs, session)
		if err != nil {
			logger.LogError(errors.New("Bundle already installed: " + bundleName))
			// Don't return error here because we're ok with this error
		}
		err = datasource.StoreBundleAssets(bundleName, "v0.0.1", "v0.0.1", sysbs, session)
		if err != nil {
			return err
		}
	}
	return nil
}

func seed(cmd *cobra.Command, args []string) {

	logger.Log("Running seed command!", logger.INFO)

	platformDSType := os.Getenv("UESIO_PLATFORM_DATASOURCE_TYPE")
	if platformDSType == "" {
		logger.Log("No Platform Data Source Type Specified", logger.ERROR)
	}

	platformDSCredentials := os.Getenv("UESIO_PLATFORM_DATASOURCE_CREDENTIALS")
	if platformDSCredentials == "" {
		logger.Log("No Platform Data Source Credentials Specified", logger.ERROR)
	}

	session, err := auth.GetHeadlessSession()
	if err != nil {
		logger.LogError(err)
		return
	}

	session.SetPermissions(&meta.PermissionSet{
		AllowAllViews:  true,
		AllowAllRoutes: true,
		AllowAllFiles:  true,
	})

	// Get the adapter for the platform DS Type
	adapter, err := adapt.GetAdapter(platformDSType, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	credentials, err := adapt.GetCredentials(platformDSCredentials, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	err = adapter.Migrate(credentials)
	if err != nil {
		logger.LogError(err)
		return
	}

	// Install Default Bundles
	// This takes code from the /libs/uesioapps code in the repo
	// and installs it into the localbundlestore.
	err = installBundles(session, "crm", "cms")
	if err != nil {
		logger.LogError(err)
		return
	}

	var apps meta.AppCollection
	var bundles meta.BundleCollection
	var workspaces meta.WorkspaceCollection
	var sites meta.SiteCollection
	var sitedomains meta.SiteDomainCollection
	var users meta.UserCollection
	var configstorevalues meta.ConfigStoreValueCollection

	err = populateSeedData(&apps, &bundles, &workspaces, &sites, &sitedomains, &users, &configstorevalues)
	if err != nil {
		logger.Log(err.Error(), logger.INFO)
		return
	}

	var teams adapt.Collection
	var teammembers adapt.Collection

	err = getSeedDataFile(&teams, "studio.teams.json")
	if err != nil {
		logger.Log(err.Error(), logger.INFO)
		return
	}

	err = getSeedDataFile(&teammembers, "studio.teammembers.json")
	if err != nil {
		logger.Log(err.Error(), logger.INFO)
		return
	}

	err = datasource.Save([]datasource.SaveRequest{
		getPlatformSeedSR(&apps),
		getPlatformSeedSR(&bundles),
		getPlatformSeedSR(&workspaces),
		getPlatformSeedSR(&sites),
		getPlatformSeedSR(&sitedomains),
		getPlatformSeedSR(&users),
		getPlatformSeedSR(&configstorevalues),
		getSeedSR("studio.teams", &teams),
		getSeedSR("studio.teammembers", &teammembers),
	}, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	logger.Log("Success", logger.INFO)

	time.Sleep(100 * time.Millisecond)
}
