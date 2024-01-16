package cmd

import (
	"bufio"
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
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
		Options: &wire.SaveOptions{
			Upsert: true,
		},
	})
}

func getSeedSR(collectionName string, collection *wire.Collection) datasource.SaveRequest {
	return datasource.SaveRequest{
		Collection: collectionName,
		Wire:       collectionName,
		Changes:    collection,
		Options: &wire.SaveOptions{
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

func runSeeds(ctx context.Context, connection wire.Connection) error {

	// Get a session with the system user
	session, err := auth.GetStudioSystemSession(ctx, connection)
	if err != nil {
		return err
	}
	permissions := session.GetSitePermissions()
	permissions.NamedRefs = map[string]bool{
		constant.WorkspaceAdminPerm: true,
	}

	if err != nil {
		return err
	}

	var apps meta.AppCollection
	var licenses meta.LicenseCollection
	var bundles meta.BundleCollection
	var licensetemplate meta.LicenseTemplateCollection
	var licensepricingtemplate meta.LicensePricingTemplateCollection
	var sites meta.SiteCollection
	var sitedomains meta.SiteDomainCollection
	var users meta.UserCollection
	var loginmethods meta.LoginMethodCollection

	if err = populateSeedData(
		&users,
		&apps,
		&licenses,
		&bundles,
		&licensetemplate,
		&licensepricingtemplate,
		&sites,
		&sitedomains,
		&loginmethods,
	); err != nil {
		return err
	}
	// We have to manually populate the repo field on all seed sites,
	// otherwise we'd have to hardcode the primary domain into the seed files.
	if err = populateRepoFieldOnSites(&sites); err != nil {
		return err
	}

	var teams wire.Collection
	var teammembers wire.Collection
	var bundlelistings wire.Collection
	var organizationusers wire.Collection

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
		getPlatformSeedSR(&sites),
		getPlatformSeedSR(&sitedomains),
		getSeedSR("uesio/core.organizationuser", &organizationusers),
		getSeedSR("uesio/studio.team", &teams),
		getSeedSR("uesio/studio.teammember", &teammembers),
		getSeedSR("uesio/studio.bundlelisting", &bundlelistings),
	}, session, datasource.GetConnectionSaveOptions(connection))
}

func seed(cmd *cobra.Command, args []string) {

	slog.Info("Running seeds")

	ctx := context.Background()

	anonSession := sess.GetStudioAnonSession(ctx)

	connection, err := datasource.GetPlatformConnection(nil, anonSession, nil)
	cobra.CheckErr(err)

	err = connection.BeginTransaction()
	cobra.CheckErr(err)

	err = runSeeds(ctx, connection)
	if err != nil {
		slog.Error("Seeds failed: " + err.Error())
		rollbackErr := connection.RollbackTransaction()
		cobra.CheckErr(rollbackErr)
		cobra.CheckErr(err)
		return
	}

	err = connection.CommitTransaction()
	cobra.CheckErr(err)

	slog.Info("Successfully ran seeds")

}

func populateRepoFieldOnSites(sites *meta.SiteCollection) error {
	return sites.Loop(func(item meta.Item, index string) error {
		bundleObj, err := item.GetField("uesio/studio.bundle")
		if err != nil || bundleObj == nil {
			return err
		}
		// If the site's associated bundle's unique key does not have the "repository" at the end of it,
		// we need to fix that to ensure that it is correct
		bundleItem, ok := bundleObj.(meta.Item)
		if !ok {
			return nil
		}
		return meta.RebuildBundleUniqueKey(bundleItem)
	})
}
