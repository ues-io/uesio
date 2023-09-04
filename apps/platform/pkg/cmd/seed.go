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

func runSeeds(connection adapt.Connection) error {
	err := connection.Migrate()
	if err != nil {
		return err
	}

	// After migration, let's get a session with the system user since we have it now.
	session, err := auth.GetStudioSystemSession(connection)
	if err != nil {
		return err
	}
	permissions := session.GetSitePermissions()
	permissions.NamedRefs = map[string]bool{
		"uesio/studio.workspace_admin": true,
	}

	if err != nil {
		return err
	}

	var apps meta.AppCollection
	var licenses meta.LicenseCollection
	var bundles meta.BundleCollection
	var licensetemplate meta.LicenseTemplateCollection
	var licensepricingtemplate meta.LicensePricingTemplateCollection
	var workspaces meta.WorkspaceCollection
	var sites meta.SiteCollection
	var sitedomains meta.SiteDomainCollection
	var users meta.UserCollection
	var loginmethods meta.LoginMethodCollection

	err = populateSeedData(
		&users,
		&apps,
		&licenses,
		&bundles,
		&licensetemplate,
		&licensepricingtemplate,
		&workspaces,
		&sites,
		&sitedomains,
		&loginmethods,
	)
	if err != nil {
		return err
	}

	var teams adapt.Collection
	var teammembers adapt.Collection
	var bundlelistings adapt.Collection
	var organizationusers adapt.Collection

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
	err = getSeedDataFile(&organizationusers, "uesio/core.organizationuser.json")
	if err != nil {
		return err
	}

	return datasource.SaveWithOptions([]datasource.SaveRequest{
		getPlatformSeedSR(&users),
		getPlatformSeedSR(&loginmethods),
		getPlatformSeedSR(&apps),
		getPlatformSeedSR(&licensetemplate),
		getPlatformSeedSR(&licensepricingtemplate),
		getPlatformSeedSR(&licenses),
		getPlatformSeedSR(&bundles),
		getPlatformSeedSR(&workspaces),
		getPlatformSeedSR(&sites),
		getPlatformSeedSR(&sitedomains),
		getSeedSR("uesio/core.organizationuser", &organizationusers),
		getSeedSR("uesio/studio.team", &teams),
		getSeedSR("uesio/studio.teammember", &teammembers),
		getSeedSR("uesio/studio.bundlelisting", &bundlelistings),
	}, session, datasource.GetConnectionSaveOptions(connection))
}

func seed(cmd *cobra.Command, args []string) {

	logger.Log("Running seed command!", logger.INFO)

	anonSession := sess.GetStudioAnonSession()

	connection, err := datasource.GetPlatformConnection(nil, anonSession, nil)
	cobra.CheckErr(err)

	err = connection.BeginTransaction()
	cobra.CheckErr(err)

	err = runSeeds(connection)
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
