package cmd

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
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

func seed(cmd *cobra.Command, args []string) {

	logger.Log("Running seed command!", logger.INFO)

	// Read files from seed folder
	var apps meta.AppCollection
	err := GetSeedDataFile(&apps, "apps.json")
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

	site := &meta.Site{
		Name: "studio",
		Bundle: &meta.Bundle{
			Namespace: "studio",
			Major:     "0",
			Minor:     "0",
			Patch:     "1",
		},
		AppRef: "studio",
	}

	bundleDef, err := bundle.GetSiteAppBundle(site)
	if err != nil {
		logger.LogError(err)
		return
	}
	site.SetAppBundle(bundleDef)

	session := sess.GetHeadlessSession(&meta.User{
		FirstName: "Guest",
		LastName:  "User",
		Profile:   "uesio.public",
	}, site)

	session.SetPermissions(&meta.PermissionSet{
		AllowAllViews:  true,
		AllowAllRoutes: true,
		AllowAllFiles:  true,
	})

	// Install Default Bundles
	// This takes code from the /libs/uesioapps code in the repo
	// and installs it into the localbundlestore.
	sysbs := &systembundlestore.SystemBundleStore{}

	err = datasource.CreateBundle("crm", "v0.0.1", "v0.0.1", "Customer Relationship Management", sysbs, session)
	if err != nil {
		logger.Log("Error Creating crm bundle. It may already exist.", logger.INFO)
	}
	err = datasource.CreateBundle("sample", "v0.0.1", "v0.0.1", "Sample Bundle", sysbs, session)
	if err != nil {
		logger.Log("Error Creating sample bundle. It may already exist.", logger.INFO)
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
				Lookups: []adapt.Lookup{
					{
						RefField: "uesio.bundle",
					},
				},
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
						RefField: "studio.app",
					},
				},
			},
		},
	}, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	logger.Log("Success", logger.INFO)

	time.Sleep(100 * time.Millisecond)
}
