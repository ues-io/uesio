module github.com/thecloudmasters/cli

go 1.24.4

require (
	github.com/AlecAivazis/survey/v2 v2.3.7
	github.com/evanw/esbuild v0.25.5
	github.com/spf13/cobra v1.9.1
	github.com/teris-io/shortid v0.0.0-20220617161101-71ec9f2aa569
	github.com/thecloudmasters/uesio v0.13.0
)

require (
	github.com/PaesslerAG/gval v1.2.4 // indirect
	github.com/francoispqt/gojay v1.2.13 // indirect
	github.com/go-chi/chi/v5 v5.1.0 // indirect
	github.com/go-chi/httplog/v3 v3.2.2 // indirect
	github.com/gofrs/uuid v4.4.0+incompatible // indirect
	github.com/gomodule/redigo v1.9.2 // indirect
	github.com/icza/session v1.3.0 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.7.5 // indirect
	github.com/kballard/go-shellquote v0.0.0-20180428030007-95032a82bc51 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mgutz/ansi v0.0.0-20200706080929-d51e80ef957d // indirect
	github.com/patrickmn/go-cache v2.1.0+incompatible // indirect
	github.com/qdm12/reprint v0.0.0-20200326205758-722754a53494 // indirect
	github.com/rogpeppe/go-internal v1.14.1 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
	github.com/spf13/pflag v1.0.6 // indirect
	github.com/xeipuuv/gojsonpointer v0.0.0-20190905194746-02993c407bfb // indirect
	github.com/xeipuuv/gojsonreference v0.0.0-20180127040603-bd5ef7bd5415 // indirect
	github.com/xeipuuv/gojsonschema v1.2.0 // indirect
	golang.org/x/crypto v0.39.0 // indirect
	golang.org/x/sync v0.15.0 // indirect
	golang.org/x/sys v0.33.0 // indirect
	golang.org/x/term v0.32.0 // indirect
	golang.org/x/text v0.26.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

// The presence of go.work makes this replace unncessary for building, however go mod tidy is module
// specific and will fail without replace being used.  See https://github.com/golang/go/issues/50750
replace github.com/thecloudmasters/uesio => ../platform
