# Interacting with ues.io via the command line

## Download the CLI

Click here to download the ues.io CLI for your operating system and architecture:

-   [Linux]($File{uesio/docs.clilinux})
-   [Mac OS (Intel)]($File{uesio/docs.climac})
-   [Mac OS (ARM)]($File{uesio/docs.climacarm64})
-   [Windows]($File{uesio/docs.cliwindows})

Next, make the binary executable, and move it into your PATH, so that you can use it from any directory:

#### Mac OS

```
chmod +x ~/Downloads/file_uesio-macos-amd64-v0-2-0
sudo mv ~/Downloads/file_uesio-macos-amd64-v0-2-0 /usr/local/bin/uesio
```

(and make sure /usr/local/bin is in your PATH)

### Testing the CLI

You should now be able to run the CLI from any directory. Try running `uesio help` to see a list of available commands:

```
The Uesio CLI

Usage:
  uesio [command]

Available Commands:
  app         All app-related commands
  bundle      Manage app bundles
  completion  Generate the autocompletion script for the specified shell
  deploy      uesio deploy
  generate    Create new metadata using a guided wizard
  help        Help about any command
  login       uesio login
  logout      uesio logout
  pack        uesio pack
  retrieve    uesio retrieve
  sethost     uesio sethost
  site        All site related commands
  siteadmin   uesio siteadmin
  status      uesio status
  upsert      uesio upsert
  work        uesio work
  workspace   All workspace related commands

Flags:
  -h, --help   help for uesio

Use "uesio [command] --help" for more information about a command.
```

**NOTE**: On Mac OS, you will be blocked from running the CLI until you trust the app, by going to System Preferences > Security & Privacy, and then under "Allow apps from", indicate that you want to allow "uesio" to be run. The next time you try to run "uesio", it should succeed

## Logging in to the Studio

Once you've downloaded and trusted the CLI, you should be able to login to the Studio with `uesio login`

You should be prompted to enter your username and password, and then should see a message indicating you successfully logged in.

```
> uesio login
Username: luigi
Password: ***********
Successfully logged in as user: Luigi Vampa (uesio/studio.standard)
```

## Setting up an app
