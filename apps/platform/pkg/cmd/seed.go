package cmd

import (
	"bufio"
	"encoding/json"
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

// GetSeedDataFile function
func GetSeedDataFile(v interface{}, fileName string) error {
	filePath := filepath.Join("seed", fileName)
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	reader := bufio.NewReader(file)
	defer file.Close()

	decoder := json.NewDecoder(reader)

	err = decoder.Decode(v)
	if err != nil {
		return err
	}

	return nil
}

func seedCollection(name, filename string, session *sess.Session) error {
	// Read files from seed folder
	changes := adapt.Collection{}
	err := GetSeedDataFile(&changes, filename)
	if err != nil {
		logger.LogError(err)
		return err
	}
	err = datasource.Save([]datasource.SaveRequest{{
		Collection: name,
		Wire:       name,
		Changes:    &changes,
		Options: &adapt.SaveOptions{
			Upsert: &adapt.UpsertOptions{},
		},
	}}, session)
	if err != nil {
		logger.LogError(err)
		return err
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

	adapter.Migrate(credentials)

	// Read files from seed folder
	var apps meta.AppCollection
	err = GetSeedDataFile(&apps, "apps.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var bundles meta.BundleCollection
	err = GetSeedDataFile(&bundles, "bundles.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var workspaces meta.WorkspaceCollection
	err = GetSeedDataFile(&workspaces, "workspaces.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var sites meta.SiteCollection
	err = GetSeedDataFile(&sites, "sites.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var siteDomains meta.SiteDomainCollection
	err = GetSeedDataFile(&siteDomains, "domains.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var users meta.UserCollection
	err = GetSeedDataFile(&users, "users.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Install Default Bundles
	// This takes code from the /libs/uesioapps code in the repo
	// and installs it into the localbundlestore.
	sysbs := &systembundlestore.SystemBundleStore{}

	err = datasource.CreateBundle("sample", "v0.0.1", "v0.0.1", "Sample Bundle", sysbs, session)
	if err != nil {
		err = datasource.StoreBundleAssets("sample", "v0.0.1", "v0.0.1", sysbs, session)
		if err != nil {
			logger.Log("Error Creating/Refreshing sample bundle.", logger.INFO)
		}
	}
	err = datasource.CreateBundle("crm", "v0.0.1", "v0.0.1", "Customer Relationship Management", sysbs, session)
	if err != nil {
		err = datasource.StoreBundleAssets("crm", "v0.0.1", "v0.0.1", sysbs, session)
		if err != nil {
			logger.Log("Error Creating/Refreshing crm bundle.", logger.INFO)
		}
	}

	err = datasource.PlatformSaves([]datasource.PlatformSaveRequest{
		{
			Collection: &apps,
			Options: &adapt.SaveOptions{
				Upsert: &adapt.UpsertOptions{},
			},
		},
		{
			Collection: &bundles,
			Options: &adapt.SaveOptions{
				Upsert: &adapt.UpsertOptions{},
			},
		},
		{
			Collection: &sites,
			Options: &adapt.SaveOptions{
				Upsert: &adapt.UpsertOptions{},
			},
		},
		{
			Collection: &siteDomains,
			Options: &adapt.SaveOptions{
				Upsert: &adapt.UpsertOptions{},
			},
		},
		{
			Collection: &workspaces,
			Options: &adapt.SaveOptions{
				Upsert: &adapt.UpsertOptions{},
				Lookups: []adapt.Lookup{
					{
						RefField:   "studio.app",
						MatchField: "uesio.name",
					},
				},
			},
		},
		{
			Collection: &users,
			Options: &adapt.SaveOptions{
				Upsert: &adapt.UpsertOptions{},
			},
		},
	}, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	err = seedCollection("studio.teams", "studio.teams.json", session)
	if err != nil {
		return
	}
	err = seedCollection("studio.teampermissions", "studio.teampermissions.json", session)
	if err != nil {
		return
	}
	err = seedCollection("studio.teammembers", "studio.teammembers.json", session)
	if err != nil {
		return
	}

	logger.Log("Success", logger.INFO)

	time.Sleep(100 * time.Millisecond)
}
