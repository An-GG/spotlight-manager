# spotlight-exclude

Manage macOS Spotlight indexing behavior.

## finally: humanity has achieved 0 fanspin idle

If your mac fan just spins up randomly at 100% sometimes, it's probably because of node_modules (or some other large folder with files you don't care about) that's being indexed.


```bash
spotlight-exclude node_modules ~/Documents
```

Prevent Spotlight from accessing any directory that matches `node_modules` (recursively) within a given directory.


This has been an issue with Spotlight for years, but now, finally, we developers 
REFUSE to have our CPU cores stolen from us by the *dreaded* **mds_stores**, 
a beast capable of bringing even the fiercest hyperthreaded sexdecacore to its knees. 
We shall never wonder why, yet again, our innocent machines must be forced toil and labor for
hours on end on nothing but a BARREN desktop! NAY! We shall fend off this ruthless torturer once and
for all, using a NodeJS command line app to modify undocumented .plists deep within macOS. Hurrah!


```bash
$ spotlight-exclude --help

SPOTLIGHT_EXCLUDE USAGE:

spotlight-exclude <DIRNAME_TO_EXCLUDE> <SEARCH_DIR (optional)> [flags]

    <DIRNAME_TO_EXCLUDE>    Name of directory you want to exclude.

    <SEARCH_DIR>            The directory in which to recursively search.

    FLAGS:
    --force                 Do not ask for confirmation, useful for 
                            calling from another script.

    -h | --help             Print this page.

Example:
spotlight-exclude node_modules ~/Documents/ --force
```

