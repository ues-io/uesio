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

	rootCmd.AddCommand(&cobra.Command{
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
			Upsert: true,
		},
	})
}

func getSeedSR(collectionName string, collection *adapt.Collection) datasource.SaveRequest {
	return datasource.SaveRequest{
		Collection: collectionName,
		Wire:       collectionName,
		Changes:    collection,
		Options: &adapt.SaveOptions{
			Upsert: true,
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

func setGuestUser(session *sess.Session, connection adapt.Connection) error {
	if session == nil {
		anonSession, err := auth.GetStudioAnonSession()
		if err != nil {
			return err
		}

		session = anonSession
	}

	user, err := auth.GetUserByKey("guest", session, connection)
	if err != nil {
		return err
	}

	sess.GUEST_USER = user

	return nil

}

func setSystemUser(session *sess.Session, connection adapt.Connection) error {
	if session == nil {
		anonSession, err := auth.GetStudioAnonSession()
		if err != nil {
			return err
		}
		session = anonSession
	}

	user, err := auth.GetUserByKey("system", session, connection)
	if err != nil {
		return err
	}

	sess.SYSTEM_USER = user

	return nil

}

func runSeeds(connection adapt.Connection, anonSession *sess.Session) error {
	err := connection.Migrate()
	if err != nil {
		return err
	}

	err = setSystemUser(anonSession, connection)
	if err != nil {
		return err
	}

	// After migration, let's get a session with the system user since we have it now.
	session, err := auth.GetStudioAdminSession()
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

	err = populateSeedData(
		&apps,
		&bundles,
		&workspaces,
		&sites,
		&sitedomains,
		&users,
		&loginmethods,
	)
	if err != nil {
		return err
	}

	var teams adapt.Collection
	var teammembers adapt.Collection
	var bundlelistings adapt.Collection

	err = getSeedDataFile(&teams, "uesio/studio.team.json")
	if err != nil {
		return err
	}
	err = getSeedDataFile(&bundlelistings, "uesio/studio.bundlelisting.json")
	if err != nil {
		return err
	}

	err = getSeedDataFile(&teammembers, "uesio/studio.teammember.json")
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
		getSeedSR("uesio/studio.team", &teams),
		getSeedSR("uesio/studio.teammember", &teammembers),
		getSeedSR("uesio/studio.bundlelisting", &bundlelistings),
	}, session, datasource.GetConnectionSaveOptions(connection))
}

func seed(cmd *cobra.Command, args []string) {

	logger.Log("Running seed command!", logger.INFO)

	anonSession, err := auth.GetStudioAnonSession()
	cobra.CheckErr(err)

	connection, err := datasource.GetPlatformConnection(anonSession)
	cobra.CheckErr(err)

	err = connection.BeginTransaction()
	cobra.CheckErr(err)

	err = runSeeds(connection, anonSession)
	if err != nil {
		logger.Log("Seeds Failed", logger.ERROR)
		rollbackErr := connection.RollbackTransaction()
		cobra.CheckErr(rollbackErr)
		cobra.CheckErr(err)
		return
	}

	err = connection.CommitTransaction()
	cobra.CheckErr(err)

	logger.Log("Success", logger.INFO)

}
