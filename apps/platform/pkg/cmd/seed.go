package cmd

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
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
	var apps metadata.AppCollection
	err := GetSeedDataFile(&apps, "apps.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var bundles metadata.BundleCollection
	err = GetSeedDataFile(&bundles, "bundles.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var workspaces metadata.WorkspaceCollection
	err = GetSeedDataFile(&workspaces, "workspaces.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var sites metadata.SiteCollection
	err = GetSeedDataFile(&sites, "sites.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	// Read files from seed folder
	var siteDomains metadata.SiteDomainCollection
	err = GetSeedDataFile(&siteDomains, "domains.json")
	if err != nil {
		logger.LogError(err)
		return
	}

	session := sess.GetHeadlessSession()

	err = datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &apps,
		Options: &adapters.SaveOptions{
			Upsert: &adapters.UpsertOptions{},
		},
	}, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	err = datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &sites,
		Options: &adapters.SaveOptions{
			Upsert: &adapters.UpsertOptions{},
		},
	}, session)

	if err != nil {
		logger.LogError(err)
		return
	}

	err = datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &siteDomains,
		Options: &adapters.SaveOptions{
			Upsert: &adapters.UpsertOptions{},
		},
	}, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	err = datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &bundles,
		Options: &adapters.SaveOptions{
			Upsert: &adapters.UpsertOptions{},
		},
	}, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	err = datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &workspaces,
		Options: &adapters.SaveOptions{
			Upsert: &adapters.UpsertOptions{},
			Lookups: []adapters.Lookup{
				{
					RefField: "uesio.app",
				},
			},
		},
	}, session)
	if err != nil {
		logger.LogError(err)
		return
	}

	time.Sleep(100 * time.Millisecond)
}
