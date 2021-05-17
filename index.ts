#!/usr/local/bin/node

import readline from 'readline';
import plist from 'plist';
import glob from 'fast-glob';
import fs from 'fs';
import child_process from 'child_process';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let PLIST_PATH = "/System/Volumes/Data/.Spotlight-V100/VolumeConfiguration.plist";
let USAGE = `
SPOTLIGHT MANAGER:

spotlight-manager <SUBCOMMAND> [<subcommand_args...>] [flags]

SUBCOMMANDS:

    exclude         <DIRNAME_TO_EXCLUDE> <SEARCH_DIR (optional)> [--force]
                    Add all matching dirs to spotlight's exclusions.
        
        <DIRNAME_TO_EXCLUDE>    Name of directory you want to exclude.

        <SEARCH_DIR>            The directory in which to recursively search.

        --force                 Do not ask for confirmation, useful for 
                                calling from another script.

    setup-exclude   
                    Set up exclusions manager to periodically search for dirs 
                    that match added exclude rules and exclude them automatically.

    add-exclude     <DIRNAME_TO_EXCLUDE> <SEARCH_DIR (optional)>
                    Add exclusion rule (checked periodically).

    remove-exclude  <DIRNAME_TO_EXCLUDE> <SEARCH_DIR>
                    Remove exclusion rule.

    list-excludes   [--showPaths] 
                    List all added exclude rules. (Only lists rules added via 
                    <add-exclude>. Rules added directly via <exclude> subcommand
                    are not tracked.)

        --showPaths             Print all added exclude rules and all 
                                actual paths the rule has excluded.

FLAGS:

    -h | --help     Print this page.
`;

if (process.argv.includes("-h") || process.argv.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
}

// Set up args




// Ask before scanning
async function main() {

    if (!process.argv[2]) { 
        console.log("Invalid usage: subcommand missing");
        console.log(USAGE);
        process.exit(1);
    }
    let subcommand = process.argv[2];
    let args = process.argv.slice(3);
    switch (subcommand) {
        case "exclude"          :   cmd_exclude(args);  break;
        case "setup-exclude"    :   cmd_setup(args);    break;
        case "add-exclude"      :   cmd_add(args);      break;
        case "remove-exclude"   :   cmd_remove(args);   break;
        case "list-excludes"    :   cmd_list(args);     break;
        default:
            console.log("Invalid usage: no such subcommand");
            console.log(USAGE);
            process.exit(1);
    }
}

async function cmd_exclude(args:string[]) {

    let confirm = !args.includes('--force');
    let exclude_name;
    if (args[0]) {
        exclude_name = args[0];
    } else {
        console.log("First Argument Missing!");
        console.log(USAGE);
        process.exit(1);
    }

    let searchdir:string = process.env.PWD;
    if (args[1]) {
        searchdir = args[1];
    }
    if (searchdir.includes("~")) {
        searchdir.replace("~", process.env.HOME)
    }

    if (!confirm) {
    
        let m = await getMatches();
        let pl_f = generateNewPlist(m);
        writePlist(pl_f);        
        restartMDS();
        finalMessage();
        process.exit(0);

    }  else {

        let m = await getMatches();
        rl.question("Confirm (y/N)?", (ans)=>{
            if (ans.toLowerCase() == 'y') {
                let pl_f = generateNewPlist(m);
                writePlist(pl_f);
                restartMDS();
                finalMessage();
            }
            process.exit(0);
        });

    }

    async function getMatches(): Promise<string[]> {
        let dirs = await glob(["**/" + exclude_name], {
            ignore: ["**/" + exclude_name + "/*/**"],
            onlyDirectories: true,
            cwd: searchdir,
            absolute: true,
        });
        for (let d of dirs) { console.log(d); }
        console.log("\nThese ("+dirs.length+") directories will be added to Spotlight's excluded dirs list, if not added already.\n");
        return dirs;
    }
    
    // Returns modified plist
    function generateNewPlist(matches:string[]): string {
        let pl_file = "";
        try { pl_file = fs.readFileSync(PLIST_PATH).toString(); } catch(e) {
            throw new Error('Unable to read spotlight plist at ' + PLIST_PATH + '\nAre you sure you are running as sudo ?\n'+
                           'In future versions of macOS beyond 11.2 (Big Sur) the plist path may have moved.');
        }
    
        let pl = plist.parse(pl_file);
    
        let new_m = [];
        for (let m of matches) {
            if (!pl['Exclusions'].includes(m)) {
                new_m.push(m);
                pl['Exclusions'].push(m);
            }
        }
    
        console.log("\n\nNew Paths:");
        for (let m of new_m) { console.log(m); }
        console.log("\n"+new_m.length+"/"+matches.length+" paths are not already excluded.");
    
        return plist.build(pl);
    }
    
    
    function writePlist(f:string) {
        fs.writeFileSync(PLIST_PATH, f);
        console.log("Plist updated. Restarting MDS...");
    }
    
    function restartMDS() {
        child_process.exec("launchctl stop com.apple.metadata.mds", (err, stdout, stderr) => { 
            console.log(err +""+ stdout +""+ stderr);
            child_process.exec("launchctl start com.apple.metadata.mds", (err2, stdout2, stderr2) => { 
                console.log(err2 +""+ stdout2 +""+ stderr2);
    
                if (stderr || stderr2) {
                    console.log("There was an error restarting the com.apple.metadata.mds service, "+
                                "which is required for changes to take effect. Restarting your computer will also restart the service");
                }
            });
        });
    
    }
    
    function finalMessage() {
        console.log("\nDone. Verify that new directories were added by navigating to System Preferences > Spotlight > Privacy");
    }
    
    

}
function cmd_setup(args:string[]) {

    

}
function cmd_add(args:string[]) {

}
function cmd_remove(args:string[]) {

}
function cmd_list(args:string[]) {

}

main();





