# Fonts

Currently all fonts available in Uesio are statically defined in this directory.

Each font family has its own directory, which contains sub-folders that are version numbers, to allow for updating of existing files.

## Adding new fonts

To add a new font family, add a "v1" directory, and then place those files within that directory, then add the font family to [fonts.css](./fonts.css)

## Modify existing fonts

If you would like to modify an existing font file, please add a new directory, e.g. "v2" if there is currently a "v1", and then clone the existing fonts into that directory, and then modify fonts.css. That ensures that existing font files will continue to be available from the prior location.
