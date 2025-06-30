package cmd

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"

	"github.com/aarol/reload"
	"github.com/go-chi/httplog/v3"
	"github.com/go-chi/traceid"
	"github.com/golang-cz/devslog"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/platformbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/systembundlestore"
	"github.com/thecloudmasters/uesio/pkg/controller/oauth"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/worker"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"

	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	//_ "net/http/pprof"
)

func init() {

	rootCmd.AddCommand(&cobra.Command{
		Use:          "serve",
		Short:        "Start Webserver",
		RunE:         serve,
		SilenceUsage: true,
	})

}

func getNSParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w+\\/\\w+}", paramName)
}

func getFullItemParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w+\\/\\w+\\.\\w+}", paramName)
}

func getMetadataItemParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w+}", paramName)
}

func getFullItemOrTextParam(paramName string) string {
	return fmt.Sprintf("{%s:(?:\\w+\\/\\w+\\.)?\\w+}", paramName)
}

var buildVersion = os.Getenv("UESIO_BUILD_VERSION")
var logFormat = httplog.SchemaOTEL.Concise(env.InDevMode())
var logger = getLogger(env.InDevMode(), logFormat)
var appParam = getNSParam("app")
var nsParam = getNSParam("namespace")
var nameParam = getMetadataItemParam("name")
var itemParam = fmt.Sprintf("%s/%s", nsParam, nameParam)
var versionParam = "{version:(?:v[0-9]+\\.[0-9]+\\.[0-9]+)|(?:[a-z0-9]{8,}(?:\\.[0-9]+\\.[0-9]+)?)}"

// Version will either be a Uesio bundle version string, e.g. v1.2.3, an 8-character
// short Git sha followed by runnumber.runattempt, e.g. abcd1234.13.3 or the current
// unix epoch time (e.g., 1738704509)
var versionedItemParam = fmt.Sprintf("%s/%s/%s", nsParam, versionParam, nameParam)

// Grouping values can either be full Uesio items (e.g. <user>/<app>.<name>) or simple values, e.g. "LISTENER",
// so the regex here needs to support both
var groupingParam = getFullItemOrTextParam("grouping")
var collectionParam = getFullItemParam("collectionname")

func serve(cmd *cobra.Command, args []string) error {

	slog.Info("Starting Uesio server")
	baseRouter := mux.NewRouter()
	// global/universal middleware
	baseRouter.Use(
		traceid.Middleware,
		middleware.RequestLogger(logger, logFormat),
	)
	// We hang /health of baseRouter because of the way Authentication middleware currently works. If it does not
	// find a "site" based on the request.Host an HTTP 500 is currently thrown. For proper health checking, we need
	// to make sure that we can access the root domain since we may not have dns to an actual site in some cases (e.g.,
	// inside docker container, we can't resolve studio.<domain>.<tld>) without a hosts entry. If/When authentication
	// is improved to allow for more graceful "no site" scenario, "baseRouter" and "r" could be combined.
	baseRouter.HandleFunc("/health", controller.Health).Methods(http.MethodGet)

	r := baseRouter.NewRoute().Subrouter()
	r.Use(
		// all routes that follow should honor authentication which may just be a public session
		// note that as currently written, authenticate will fail if no site can be resolved via request.Host
		// which is something that could use some improvement.
		middleware.Authenticate,
	)

	// Profiler Info
	// r.PathPrefix("/debug/pprof").Handler(http.DefaultServeMux)

	r.Handle("/static/{filename:.*}", file.Static()).Methods(http.MethodGet)

	//r.HandleFunc("/api/weather", testapis.TestApi).Methods(http.MethodGet, http.MethodPost, http.MethodDelete)

	// The workspace router
	workspacePath := fmt.Sprintf("/workspace/%s/{workspace}", appParam)
	wr := r.PathPrefix(workspacePath).Subrouter()
	wr.Use(middleware.AuthenticateWorkspace)

	// The version router
	versionPath := fmt.Sprintf("/version/%s/%s", appParam, versionParam)
	vr := r.PathPrefix(versionPath).Subrouter()
	vr.Use(middleware.AuthenticateVersion)

	// The site admin router
	siteAdminPath := fmt.Sprintf("/siteadmin/%s/{site}", appParam)
	sa := r.PathPrefix(siteAdminPath).Subrouter()
	sa.Use(middleware.AuthenticateSiteAdmin)

	// The site router
	sr := r.PathPrefix("/site").Subrouter()

	// The local router
	lr := r.NewRoute().Subrouter()

	// SEO Routes
	lr.HandleFunc("/robots.txt", controller.Robots).Methods(http.MethodGet)
	lr.HandleFunc("/favicon.ico", controller.Favicon).Methods(http.MethodGet)

	// OAuth routes
	sr.HandleFunc("/oauth2/callback", oauth.Callback).Methods(http.MethodGet)
	wr.HandleFunc("/oauth2/authorize/"+itemParam, oauth.GetRedirectMetadata).Methods(http.MethodGet)
	sr.HandleFunc("/oauth2/authorize/"+itemParam, oauth.GetRedirectMetadata).Methods(http.MethodGet)
	sa.HandleFunc("/oauth2/authorize/"+itemParam, oauth.GetRedirectMetadata).Methods(http.MethodGet)
	vr.HandleFunc("/oauth2/authorize/"+itemParam, oauth.GetRedirectMetadata).Methods(http.MethodGet)
	if env.InDevMode() {
		// Add a mock oauth2 token server for testing. Someday this could be a real server
		// but for now we just need it for integration tests
		sr.HandleFunc("/oauth2/token", oauth.GetOAuthToken).Methods(http.MethodPost)
	}

	// Userfile routes for site and workspace context
	userfileUploadPath := "/userfiles/upload"
	sr.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)
	wr.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)
	sa.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)

	userfileDeletePath := "/userfiles/delete/{fileid:.*}"
	sr.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)
	wr.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)
	sa.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)

	userfileDownloadPath := "/userfiles/download"
	sr.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)
	wr.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)
	sa.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)

	attachmentDownloadPath := "/attachment/{recordid}/{version}/{path:.*}"
	sr.HandleFunc(attachmentDownloadPath, file.DownloadAttachment).Methods(http.MethodGet)
	wr.HandleFunc(attachmentDownloadPath, file.DownloadAttachment).Methods(http.MethodGet)
	sa.HandleFunc(attachmentDownloadPath, file.DownloadAttachment).Methods(http.MethodGet)

	// Wire load and save routes for site and workspace context
	wireLoadPath := "/wires/load"
	sr.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)
	wr.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)
	sa.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)

	wireSavePath := "/wires/save"
	sr.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)
	wr.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)
	sa.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)

	// Bot routes for site and workspace context
	callBotPath := "/bots/call/" + itemParam
	sr.HandleFunc(callBotPath, controller.CallListenerBot).Methods(http.MethodPost)
	wr.HandleFunc(callBotPath, controller.CallListenerBot).Methods(http.MethodPost)
	sa.HandleFunc(callBotPath, controller.CallListenerBot).Methods(http.MethodPost)

	botParamPath := "/bots/params/{type}/" + itemParam
	sr.HandleFunc(botParamPath, controller.GetBotParams).Methods(http.MethodGet)
	wr.HandleFunc(botParamPath, controller.GetBotParams).Methods(http.MethodGet)

	// Get app-specific type definition files
	wr.HandleFunc("/retrieve/types", controller.RetrieveAppTypes).Methods(http.MethodGet)

	// Run Integration Action routes for site and workspace context
	runIntegrationActionPath := "/integrationactions/run/" + itemParam
	describeActionsPath := "/integrationactions/describe/" + itemParam
	sr.HandleFunc(runIntegrationActionPath, controller.RunIntegrationAction).Methods(http.MethodPost)
	wr.HandleFunc(runIntegrationActionPath, controller.RunIntegrationAction).Methods(http.MethodPost)
	wr.HandleFunc(describeActionsPath, controller.DescribeIntegrationAction).Methods(http.MethodGet)

	viewParamPath := "/views/params/" + itemParam
	wr.HandleFunc(viewParamPath, controller.GetViewParams).Methods(http.MethodGet)
	routeParamPath := "/routes/params/" + itemParam
	wr.HandleFunc(routeParamPath, controller.GetRouteParams).Methods(http.MethodGet)

	//
	// File (actual metadata, not userfiles) routes for site and workspace context

	// Versioned file serving routes
	versionedFilesPath := "/files/" + versionedItemParam
	sr.HandleFunc(versionedFilesPath, file.ServeFile).Methods(http.MethodGet)
	wr.HandleFunc(versionedFilesPath, file.ServeFile).Methods(http.MethodGet)

	versionedFilesPathWithPath := fmt.Sprintf("/files/%s/{path:.*}", versionedItemParam)
	sr.HandleFunc(versionedFilesPathWithPath, file.ServeFile).Methods(http.MethodGet)
	wr.HandleFunc(versionedFilesPathWithPath, file.ServeFile).Methods(http.MethodGet)

	// Explicit namespaced route page load access for site and workspace context
	serveRoutePath := fmt.Sprintf("/app/%s/{route:.*}", nsParam)
	sr.HandleFunc(serveRoutePath, controller.ServeRoute)
	wr.HandleFunc(serveRoutePath, controller.ServeRoute)
	serveRouteByKey := "/r/" + itemParam
	sr.HandleFunc(serveRouteByKey, controller.ServeRouteByKey)
	wr.HandleFunc(serveRouteByKey, controller.ServeRouteByKey)

	// Route navigation apis for site and workspace context for collection based route assignments
	collectionRouteAssignmentPath := "/routes/assignment/{viewtype}/collection/" + itemParam
	sr.HandleFunc(collectionRouteAssignmentPath, controller.RouteAssignment).Methods(http.MethodGet)
	wr.HandleFunc(collectionRouteAssignmentPath, controller.RouteAssignment).Methods(http.MethodGet)
	sr.HandleFunc(collectionRouteAssignmentPath+"/{id}", controller.RouteAssignment).Methods(http.MethodGet)
	wr.HandleFunc(collectionRouteAssignmentPath+"/{id}", controller.RouteAssignment).Methods(http.MethodGet)

	// TODO: Currently only supporting collection based route assignments since the only non-collection
	// route we have is "signup".  As route assignments evolve and non-collection based routes are added
	// need to support those assignment routes.
	// Route navigation apis for site and workspace context for non-collection based route assignments
	// routeAssignmentPath := fmt.Sprintf("/routes/assignment/{viewtype}")
	// sr.HandleFunc(routeAssignmentPath, controller.RouteAssignment).Methods(http.MethodGet)
	// wr.HandleFunc(routeAssignmentPath, controller.RouteAssignment).Methods(http.MethodGet)

	pathRoutePath := fmt.Sprintf("/routes/path/%s/{route:.*}", nsParam)
	sr.HandleFunc(pathRoutePath, controller.RouteByPath).Methods(http.MethodGet)
	wr.HandleFunc(pathRoutePath, controller.RouteByPath).Methods(http.MethodGet)

	routeByKey := "/routes/key/" + itemParam
	sr.HandleFunc(routeByKey, controller.RouteByKey).Methods(http.MethodGet)
	wr.HandleFunc(routeByKey, controller.RouteByKey).Methods(http.MethodGet)

	// Versioned component pack file routes
	versionedComponentPackPath := "/componentpacks/" + versionedItemParam + "/{filename:.*}"

	sr.HandleFunc(versionedComponentPackPath, file.ServeComponentPackFile).Methods(http.MethodGet)
	wr.HandleFunc(versionedComponentPackPath, file.ServeComponentPackFile).Methods(http.MethodGet)

	fontPath := "/fonts/" + versionedItemParam + "/{filename:.*}"

	sr.HandleFunc(fontPath, file.ServeFontFile).Methods(http.MethodGet)
	wr.HandleFunc(fontPath, file.ServeFontFile).Methods(http.MethodGet)

	// Workspace context specific routes
	wr.HandleFunc("/metadata/deploy", controller.Deploy).Methods(http.MethodPost)
	wr.HandleFunc("/metadata/generate/"+itemParam, controller.GenerateToWorkspace).Methods(http.MethodPost)
	wr.HandleFunc("/metadata/builder/"+itemParam, controller.BuilderMetadata).Methods(http.MethodGet)
	sr.HandleFunc("/metadata/view/"+itemParam, controller.ViewMetadata).Methods(http.MethodGet)
	wr.HandleFunc("/metadata/view/"+itemParam, controller.ViewMetadata).Methods(http.MethodGet)
	wr.HandleFunc("/data/truncate", controller.Truncate).Methods(http.MethodPost)

	// List All Available Namespaces
	metadataRetrievePath := "/metadata/retrieve"
	wr.HandleFunc(metadataRetrievePath, controller.Retrieve).Methods(http.MethodGet, http.MethodPost)
	vr.HandleFunc(metadataRetrievePath, controller.Retrieve).Methods(http.MethodGet, http.MethodPost)

	// Get Collection Metadata (We may be able to get rid of this someday...)
	collectionMetadataPath := "/collections/meta/" + collectionParam
	wr.HandleFunc(collectionMetadataPath, controller.GetCollectionMetadata).Methods(http.MethodGet)
	sa.HandleFunc(collectionMetadataPath, controller.GetCollectionMetadata).Methods(http.MethodGet)

	// List All Available Namespaces
	namespaceListPath := "/metadata/namespaces"
	wr.HandleFunc(namespaceListPath, controller.NamespaceList).Methods(http.MethodGet)
	sa.HandleFunc(namespaceListPath, controller.NamespaceList).Methods(http.MethodGet)
	vr.HandleFunc(namespaceListPath, controller.NamespaceList).Methods(http.MethodGet)
	wr.HandleFunc(namespaceListPath+"/{type}", controller.NamespaceList).Methods(http.MethodGet)
	sa.HandleFunc(namespaceListPath+"/{type}", controller.NamespaceList).Methods(http.MethodGet)
	vr.HandleFunc(namespaceListPath+"/{type}", controller.NamespaceList).Methods(http.MethodGet)

	// List All Namespace Items
	itemListPath := "/metadata/types/{type}/list"
	sr.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)
	wr.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)

	itemListPathWithGrouping := "/metadata/types/{type}/list/" + groupingParam
	sr.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	wr.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)

	nsItemListPath := fmt.Sprintf("/metadata/types/{type}/namespace/%s/list", nsParam)
	sr.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)
	wr.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)

	nsItemListPathWithGrouping := fmt.Sprintf("/metadata/types/{type}/namespace/%s/list/%s", nsParam, groupingParam)
	wr.HandleFunc(nsItemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(nsItemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(nsItemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)

	// Bulk Job Routes
	bulkJobPath := "/bulk/job"
	wr.HandleFunc(bulkJobPath, controller.BulkJob).Methods(http.MethodPost)
	sa.HandleFunc(bulkJobPath, controller.BulkJob).Methods(http.MethodPost)

	bulkBatchPath := "/bulk/job/{job}/batch"
	wr.HandleFunc(bulkBatchPath, controller.BulkBatch).Methods(http.MethodPost)
	sa.HandleFunc(bulkBatchPath, controller.BulkBatch).Methods(http.MethodPost)

	// View Preview Routes
	viewPath := "/views/" + itemParam
	wr.HandleFunc(viewPath+"/preview", controller.ViewPreview(false)).Methods(http.MethodGet)
	wr.HandleFunc(viewPath+"/edit", controller.ViewPreview(true)).Methods(http.MethodGet)

	// Version context specific routes
	vr.HandleFunc("/metadata/generate/"+itemParam, controller.Generate).Methods("POST")
	vr.HandleFunc("/bots/params/{type}/"+itemParam, controller.GetBotParams).Methods("GET")

	// Auth Routes
	sr.HandleFunc("/auth/"+itemParam+"/createlogin", controller.CreateLogin).Methods("POST")
	sa.HandleFunc("/auth/"+itemParam+"/createlogin", controller.CreateLogin).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/login", controller.Login).Methods("POST")
	wr.HandleFunc("/auth/"+itemParam+"/login", controller.Login).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/signup", controller.Signup).Methods("POST")
	sa.HandleFunc("/auth/"+itemParam+"/resetpassword", controller.ResetPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/resetpassword", controller.ResetPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/resetpassword/confirm", controller.ConfirmResetPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/signup/confirm", controller.ConfirmSignUp).Methods("GET")
	wr.HandleFunc("/auth/credentials/"+itemParam, controller.DeleteAuthCredentials).Methods("DELETE")
	sr.HandleFunc("/auth/credentials/"+itemParam, controller.DeleteAuthCredentials).Methods("DELETE")
	sa.HandleFunc("/auth/credentials/"+itemParam, controller.DeleteAuthCredentials).Methods("DELETE")
	sr.HandleFunc("/auth/logout", controller.Logout).Methods("POST")
	sr.HandleFunc("/auth/check", controller.AuthCheck).Methods("GET")

	sr.HandleFunc("/auth/"+itemParam+"/requestlogin", controller.RequestLogin).Methods("GET")
	wr.HandleFunc("/auth/"+itemParam+"/requestlogin", controller.RequestLogin).Methods("GET")

	// Experimental REST api route
	sr.HandleFunc("/rest/"+itemParam, controller.Rest).Methods("GET")

	// Bundles
	bundleVersionsListPath := fmt.Sprintf("/bundles/v1/versions/%s/list", appParam)
	sr.HandleFunc(bundleVersionsListPath, controller.BundleVersionsList).Methods("GET")
	sr.HandleFunc("/bundles/v1/list", controller.BundlesList).Methods("GET")
	bundleRetrievePath := fmt.Sprintf("/bundles/v1/retrieve/%s/%s", appParam, versionParam)
	sr.HandleFunc(bundleRetrievePath, controller.BundlesRetrieve).Methods("GET")

	// Dev Only Routes
	if env.InDevMode() {
		// Allow for running the usage worker immediately
		sr.HandleFunc("/worker/usage", controller.RunUsageWorker).Methods("POST")
		// Display some stats about the app's performance
		sr.HandleFunc("/perf/stats", controller.GetPerfStats).Methods("GET")
		sr.HandleFunc("/perf/stats/reset", controller.ResetPerfStats).Methods("POST")
	}

	// REST API routes
	sr.HandleFunc("/api/v1/collection/"+itemParam, controller.DeleteRecordApi).Methods("DELETE")
	sa.HandleFunc("/api/v1/collection/"+itemParam, controller.DeleteRecordApi).Methods("DELETE")

	// Add Invalid Routes to all subrouters to give 404s
	invalidPath := "/{invalidroute:.*}"
	sr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	wr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	sa.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	vr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)

	// Special handling for local routes
	lr.HandleFunc("/{route:.*}", controller.ServeLocalRoute)

	port := env.GetPort()
	// Host can be blank by default which will listen on all interfaces
	host := env.GetHost()
	serveAddr := host + ":" + port

	// Universal middlewares
	// In order for reload package to inject its script (and avoid manually having to have it in our code)
	// gzip compression must be disabled.  Additionally, when running in dev mode, gzip isn't really needed.
	if !env.InDevMode() {
		r.Use(middleware.GZip())
	}

	var handler http.Handler = baseRouter
	if env.InDevMode() {
		reloader := reload.New(".watch")
		reloader.OnReload = func() {
			// invalidate any caches
			platformbundlestore.InvalidateCache()
			systembundlestore.InvalidateCache()
		}
		handler = reloader.Handle(baseRouter)
	}

	server := controller.NewServer(serveAddr, handler)
	var serveErr error

	done := make(chan bool)
	go func() {
		if tls.ServeAppWithTLS() {
			slog.Info("Service started over TLS on port: " + port)
			serveErr = server.ListenAndServeTLS(tls.GetSelfSignedCertFilePath(), tls.GetSelfSignedPrivateKeyFile())
		} else {
			slog.Info("Service started on port: " + port)
			serveErr = server.ListenAndServe()
		}
		// CORS Stuff we don't need right now
		/*
			err := http.ListenAndServe(":"+port, handlers.CORS(
				handlers.AllowedOrigins([]string{"*"}),
				handlers.AllowedMethods([]string{"*"}),
				handlers.AllowedHeaders([]string{"*"}),
			)(r))
		*/
		if serveErr != nil && serveErr.Error() != "http: Server closed" {
			slog.Error("failed to start server: " + serveErr.Error())
			// this will terminate the server without waiting for graceful shutdown
			server.StartupError()
		}
		done <- true
	}()

	if os.Getenv("UESIO_WORKER_MODE") == "combined" {
		slog.Info("Running worker combined with web server")
		go func() {
			worker.ScheduleJobs()
		}()
	}

	// wait for graceful shutdown to complete
	server.WaitShutdown()

	<-done

	return nil
}

func logHandler(isDevMode bool, handlerOpts *slog.HandlerOptions) slog.Handler {
	var baseHandler slog.Handler
	if isDevMode {
		// Pretty logs for development.
		baseHandler = devslog.NewHandler(os.Stdout, &devslog.Options{
			SortKeys:           true,
			MaxErrorStackTrace: 5,
			MaxSlicePrintSize:  20,
			HandlerOptions:     handlerOpts,
			TimeFormat:         "[15:04:05.000]",
		})
	} else {
		// JSON logs for production
		baseHandler = slog.NewJSONHandler(os.Stdout, handlerOpts)
	}

	return traceid.LogHandler(baseHandler)
}

func getLogger(isDevMode bool, logFormat *httplog.Schema) *slog.Logger {
	var logLevel slog.Level
	if val, isSet := os.LookupEnv("UESIO_LOG_LEVEL"); isSet {
		if levelVar, err := strconv.Atoi(val); err == nil {
			logLevel = (slog.Level)(levelVar)
		}
	}

	logger := slog.New(logHandler(isDevMode, &slog.HandlerOptions{
		AddSource:   false,
		ReplaceAttr: logFormat.ReplaceAttr,
		Level:       logLevel,
	}))

	if !isDevMode {
		// intentionally ignoring error as hostname is not critical
		hn, _ := os.Hostname()
		logger = logger.With(
			slog.String("host.name", hn),
			slog.Group("app",
				slog.String("name", "uesio-platform"),
				slog.String("version", buildVersion),
				slog.String("env", "production"),
			),
		)
	}

	slog.SetDefault(logger)

	return logger
}
