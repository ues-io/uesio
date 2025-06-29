package cmd

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func init() {

	rootCmd.AddCommand(&cobra.Command{
		Use:          "seed",
		Short:        "Seed Database",
		RunE:         seed,
		SilenceUsage: true,
	})

	rootCmd.PersistentFlags().BoolP("ignore-failures", "i", false, "Set to true to ignore seed failures")

}

func getSeedDataFile(v any, fileName string) error {
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

	var apps meta.AppCollection
	var licenses meta.LicenseCollection
	var bundles meta.BundleCollection
	var licensetemplate meta.LicenseTemplateCollection
	var licensepricingtemplate meta.LicensePricingTemplateCollection
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
		&sites,
		&sitedomains,
		&loginmethods,
	)
	if err != nil {
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
	}, session, datasource.NewSaveOptions(connection, nil))
}

func seed(cmd *cobra.Command, args []string) error {

	slog.Info("Running seeds")

	ignoreSeedFailures, _ := cmd.Flags().GetBool("ignore-failures")

	ctx := context.Background()

	anonSession := sess.GetStudioAnonSession(ctx)

	err := datasource.WithTransaction(anonSession, nil, func(conn wire.Connection) error {
		return runSeeds(ctx, conn)
	})
	if err != nil {
		if ignoreSeedFailures {
			slog.InfoContext(ctx, "Ignoring seed failures.")
			return nil
		}
		return fmt.Errorf("seeds failed: %w", err)
	}

	slog.InfoContext(ctx, "Successfully ran seeds")
	return nil
}
