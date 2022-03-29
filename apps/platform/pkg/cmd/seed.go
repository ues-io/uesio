package cmd

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
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

func runSeeds(connection adapt.Connection, session *sess.Session) error {
	err := connection.Migrate()
	if err != nil {
		return err
	}

	var apps meta.AppCollection
	var bundles meta.BundleCollection
	var workspaces meta.WorkspaceCollection
	var sites meta.SiteCollection
	var sitedomains meta.SiteDomainCollection
	var users meta.UserCollection
	var loginmethods meta.LoginMethodCollection
	var configstorevalues meta.ConfigStoreValueCollection

	err = populateSeedData(
		&apps,
		&bundles,
		&workspaces,
		&sites,
		&sitedomains,
		&users,
		&loginmethods,
		&configstorevalues,
	)
	if err != nil {
		return err
	}

	var teams adapt.Collection
	var teammembers adapt.Collection

	err = getSeedDataFile(&teams, "uesio/studio.teams.json")
	if err != nil {
		return err
	}

	err = getSeedDataFile(&teammembers, "uesio/studio.teammembers.json")
	if err != nil {
		return err
	}

	return datasource.SaveWithOptions([]datasource.SaveRequest{
		getPlatformSeedSR(&users),
		getPlatformSeedSR(&loginmethods),
		getPlatformSeedSR(&apps),
		getPlatformSeedSR(&bundles),
		getPlatformSeedSR(&workspaces),
		getPlatformSeedSR(&sites),
		getPlatformSeedSR(&sitedomains),
		getPlatformSeedSR(&configstorevalues),
		getSeedSR("uesio/studio.teams", &teams),
		getSeedSR("uesio/studio.teammembers", &teammembers),
	}, session, datasource.GetConnectionSaveOptions(connection))
}

func seed(cmd *cobra.Command, args []string) {

	logger.Log("Running seed command!", logger.INFO)

	session, err := auth.GetStudioAdminSession()
	if err != nil {
		logger.LogError(err)
		return
	}

	connection, err := datasource.GetPlatformConnection(session)
	if err != nil {
		logger.LogError(err)
		return
	}

	err = connection.BeginTransaction()
	if err != nil {
		logger.LogError(err)
		return
	}

	err = runSeeds(connection, session)
	if err != nil {
		logger.Log("Seeds Failed", logger.ERROR)
		logger.LogError(err)
		err := connection.RollbackTransaction()
		if err != nil {
			logger.LogError(err)
			return
		}
		return
	}

	err = connection.CommitTransaction()
	if err != nil {
		logger.LogError(err)
		return
	}

	logger.Log("Success", logger.INFO)

}
