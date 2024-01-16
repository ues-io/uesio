package cmd

import (
	"context"
	"log/slog"

	"github.com/spf13/cobra"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func init() {
	rootCmd.AddCommand(&cobra.Command{
		Use:   "migrate",
		Short: "Run database migrations",
		Run:   migrate,
	})
}

func migrate(cmd *cobra.Command, args []string) {

	slog.Info("Running migrations")
	ctx := context.Background()

	anonSession := sess.GetStudioAnonSession(ctx)

	connection, err := datasource.GetPlatformConnection(nil, anonSession, nil)
	cobra.CheckErr(err)

	err = connection.BeginTransaction()
	cobra.CheckErr(err)

	if err = connection.Migrate(); err != nil {
		slog.Error("Migrations failed: " + err.Error())
		rollbackErr := connection.RollbackTransaction()
		cobra.CheckErr(rollbackErr)
		cobra.CheckErr(err)
		return
	}

	err = connection.CommitTransaction()
	cobra.CheckErr(err)

	slog.Info("Successfully ran migrations")

}
