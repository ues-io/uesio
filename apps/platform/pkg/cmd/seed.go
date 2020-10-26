package cmd

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/thecloudmasters/uesio/pkg/sess"
	site2 "github.com/thecloudmasters/uesio/pkg/site"

	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/spf13/cobra"
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

	site, err := site2.GetSite("studio")
	if err != nil {
		logger.LogError(err)
		return
	}

	s, err := sess.CreateBrowserSession(&metadata.User{
		Profile:   "uesio.standard",
		FirstName: "seed",
		LastName:  "seed",
	}, site)
	if err != nil {
		logger.LogError(err)
		return
	}

	_, err = datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &apps,
			Options: &reqs.SaveOptions{
				Upsert: &reqs.UpsertOptions{},
			},
		},
	}, site, s)
	if err != nil {
		logger.LogError(err)
		return
	}

	_, err = datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &bundles,
			Options: &reqs.SaveOptions{
				Upsert: &reqs.UpsertOptions{},
			},
		},
	}, site, s)
	if err != nil {
		logger.LogError(err)
		return
	}

	_, err = datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &workspaces,
			Options: &reqs.SaveOptions{
				Upsert: &reqs.UpsertOptions{},
				Lookups: []reqs.Lookup{
					{
						RefField: "uesio.app",
					},
				},
			},
		},
	}, site, s)
	if err != nil {
		logger.LogError(err)
		return
	}

	time.Sleep(100 * time.Millisecond)
}
