module github.com/thecloudmasters/cli

go 1.24.5

require (
	github.com/AlecAivazis/survey/v2 v2.3.7
	github.com/cli/browser v1.3.0
	github.com/evanw/esbuild v0.25.8
	github.com/spf13/cobra v1.9.1
	github.com/teris-io/shortid v0.0.0-20220617161101-71ec9f2aa569
	github.com/thecloudmasters/uesio v0.14.1
	golang.org/x/sync v0.16.0
)

require (
	github.com/NYTimes/gziphandler v1.1.1 // indirect
	github.com/PaesslerAG/gval v1.2.4 // indirect
	github.com/alexedwards/scs/redisstore v0.0.0-20250417082927-ab20b3feb5e9 // indirect
	github.com/alexedwards/scs/v2 v2.9.0 // indirect
	github.com/beevik/etree v1.5.1 // indirect
	github.com/bigkevmcd/go-cachewrapper v0.0.0-20240507155736-346a72d92df1 // indirect
	github.com/btcsuite/btcd/btcutil v1.1.6 // indirect
	github.com/crewjam/saml v0.5.1 // indirect
	github.com/dolmen-go/contextio v1.0.0 // indirect
	github.com/francoispqt/gojay v1.2.13 // indirect
	github.com/go-chi/chi/v5 v5.2.2 // indirect
	github.com/go-chi/httplog/v3 v3.2.2 // indirect
	github.com/gofrs/uuid/v5 v5.3.2 // indirect
	github.com/golang-jwt/jwt/v4 v4.5.2 // indirect
	github.com/gomodule/redigo v1.9.2 // indirect
	github.com/gorilla/mux v1.8.1 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.7.5 // indirect
	github.com/jonboulle/clockwork v0.5.0 // indirect
	github.com/kballard/go-shellquote v0.0.0-20180428030007-95032a82bc51 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/mattermost/xml-roundtrip-validator v0.1.0 // indirect
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mgutz/ansi v0.0.0-20200706080929-d51e80ef957d // indirect
	github.com/patrickmn/go-cache v2.1.0+incompatible // indirect
	github.com/qdm12/reprint v0.0.0-20200326205758-722754a53494 // indirect
	github.com/rogpeppe/go-internal v1.14.1 // indirect
	github.com/russellhaering/goxmldsig v1.5.0 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
	github.com/spf13/pflag v1.0.7 // indirect
	github.com/xeipuuv/gojsonpointer v0.0.0-20190905194746-02993c407bfb // indirect
	github.com/xeipuuv/gojsonreference v0.0.0-20180127040603-bd5ef7bd5415 // indirect
	github.com/xeipuuv/gojsonschema v1.2.0 // indirect
	golang.org/x/crypto v0.40.0 // indirect
	golang.org/x/sys v0.34.0 // indirect
	golang.org/x/term v0.33.0 // indirect
	golang.org/x/text v0.27.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

// The presence of go.work makes this replace unncessary for building, however go mod tidy is module
// specific and will fail without replace being used.  See https://github.com/golang/go/issues/50750
replace github.com/thecloudmasters/uesio => ../platform
