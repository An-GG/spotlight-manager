# spotlight-manager

Manage macOS Spotlight indexing behavior.

## finally: humanity has achieved 0 fanspin idle

If your mac fan just spins up randomly at 100% sometimes, it's probably because of node_modules (or some other large folder with files you don't care about) that's being indexed.


```bash
spotlight-manager node_modules ~/Documents
```

Prevent Spotlight from accessing any directory that matches (recursively) `node_modules` or any other dir inside a given base directory.


This has been an issue with Spotlight for years, but now, finally, we developers 
REFUSE to have our CPU cores stolen from us by the *dreaded* **mds_stores**, 
a beast capable of bringing even the fiercest hyperthreaded sexdecacore to its knees. 
We shall never wonder why, yet again, our innocent machines must be forced toil and labor for
hours on end on nothing but a BARREN desktop! NAY! We shall fend off this ruthless torturer once and
for all, using a NodeJS command line app to modify undocumented .plists deep within macOS. Hurrah!


I recommend setting up a cron job to run `spotlight-manager job` every week or so. 
(You will need to run as superuser, add the path of wherever `spotlight-manager` is installed to the sudoers file.)
Then, use `spotlight-manager add <DIRNAME>` to maintain a list directory-matching rules in `~/.spotlight-manager` which will all be searched for at once in the background.

```bash
$ spotlight-manager --help

SPOTLIGHT MANAGER:

spotlight-manager <SUBCOMMAND> [<subcommand_args...>] [flags]

SUBCOMMANDS:

    exclude         <DIRNAME_TO_EXCLUDE> <SEARCH_DIR (optional)> [--force]
                    Add all matching dirs to spotlight's exclusions.
        
        <DIRNAME_TO_EXCLUDE>    Name of directory you want to exclude.

        <SEARCH_DIR>            The directory in which to recursively search.

        --force                 Do not ask for confirmation, useful for 
                                calling from another script.

    job   
                    Search for any new exclusions that match saved 
                    exclusion rules and exclude all at once. (use for cron job)

    add             <DIRNAME_TO_EXCLUDE> <SEARCH_DIR (optional)>
                    Add exclusion rule to be checked by job.

    remove          <DIRNAME_TO_EXCLUDE> <SEARCH_DIR>
                    Remove exclusion rule.

    list            [--showPaths] 
                    List all added exclude rules. (Only lists rules added via 
                    <add>. Rules added directly via <exclude> subcommand
                    are not tracked.)

        --showPaths             Print all added exclude rules and all 
                                actual paths the rule has excluded.

FLAGS:

    -h | --help     Print this page.
```

