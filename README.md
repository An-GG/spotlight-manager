# spotlight-manager

Manage macOS Spotlight indexing behavior (without modifying your filesystem).
- Automatically add certain directories to System Preferences > Spotlight > Privacy
- This utility does **not** create `.metadata_never_index` files.

## finally: humanity has achieved 0 fanspin idle

If your mac fan just spins up randomly at 100% sometimes, it's probably because of node_modules (or some other large folder with files you don't care about) that's being indexed.

## Installation
```bash
$ npm install -g spotlight-manager
```
## Usage
Prevent Spotlight from accessing any directory that matches (recursively) `node_modules` or any other dir you choose inside a given base directory.
```bash
sudo spotlight-manager exclude node_modules ~/Documents
```

**NOTE: You will likely need to always run as superuser as R/W access to root owned System plists is necessary.**


This has been an issue with Spotlight for years, but now, finally, we developers 
REFUSE to have our CPU cores stolen from us by the *dreaded* **mds_stores**, 
a beast capable of bringing even the fiercest hyperthreaded sexdecacore to its knees. 
We shall never wonder why, yet again, our innocent machines must be forced toil and labor for
hours on end on nothing but a BARREN desktop! NAY! We shall fend off this ruthless torturer once and
for all, using a NodeJS command line app to modify undocumented .plists deep within macOS. Hurrah!


I recommend setting up a cron job to run `spotlight-manager job` every week or so. 
(You will need to run as superuser, add the path of wherever `spotlight-manager` is installed to the sudoers file.)
Then, use `spotlight-manager add <DIRNAME>` to maintain a list directory-matching rules in `~/.spotlight-manager` which will be searched for and excluded all at once whenever your cron job runs.

```ts
$ spotlight-manager --help

SPOTLIGHT MANAGER:

spotlight-manager <SUBCOMMAND> [<subcommand_args...>] [flags]

SUBCOMMANDS:

    exclude         <DIRNAME_TO_EXCLUDE> <SEARCH_DIR (optional)> [--force]
                    Add all matching dirs to spotlight's exclusions.
        
        <DIRNAME_TO_EXCLUDE>    Name of directory you want to exclude.

        <SEARCH_DIR>            The directory in which to recursively search.
                                (optional): Will use cwd by default.

        --force                 Do not ask for confirmation, useful for 
                                calling from another script.

    unexclude       <DIRNAME_TO_UNEXCLUDE> <SEARCH_DIR (optional)> [--force]
                    Remove excluded dirs matching these rules from spotlight's 
                    exclusions. (renable indexing of this directory)
    job   
                    Search for any new exclusions that match saved 
                    exclusion rules and exclude all at once. (use for cron job)
                        <!> NOTE: job can only exclude new exclusions. <!> 
                    This prevents unrelated exclusions from being affected.

    add             <DIRNAME_TO_EXCLUDE> <SEARCH_DIR (optional)> [--force]
                    Add exclusion rule to be checked by job, and run job once.

    remove          <DIRNAME_TO_EXCLUDE> <SEARCH_DIR> [--force]
                    Remove exclusion rule checked by job, and run !! unexclude !!
                    NOT job because job does not remove exclusions.
                    <!> Assumes matching exclusions were all added by manager <!>

    list            [--showPaths] 
                    List all added exclude rules. (Only lists rules added via 
                    <add>. Rules added directly via <exclude> subcommand
                    are not tracked.)

        --showPaths             Print all added exclude rules and all 
                                actual paths the rule matches that are
                                excluded in the plist.

FLAGS:

    -h | --help     Print this page.
```

