#!/usr/local/bin/node

import readline from 'readline';
import plist from 'plist';
import glob from 'fast-glob';
import fs from 'fs';
import child_process from 'child_process';
import globToRegExp from 'glob-to-regexp';
import { promisify } from 'util';


let rl:readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function rlqconvert(query:string, cb:(er:Error, response:string)=>void) {
    rl.question(query, (ans)=>{
        cb(null, ans); 
    });
}
let question_async = promisify(rlqconvert)


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
`;

if (process.argv.includes("-h") || process.argv.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
}


async function main() {
    

    if (!process.argv[2]) { 
        console.log("Invalid usage: subcommand missing");
        console.log(USAGE);
        process.exit(1);
    }
    let subcommand = process.argv[2];
    let args = process.argv.slice(3);
    switch (subcommand) {
        case "exclude"          :   await cmd_exclude(args);  break;
        case "unexclude"        :   await cmd_unexclude(args);break;
        case "add"              :   await cmd_add(args);      break;
        case "remove"           :   await cmd_remove(args);   break;
        case "list"             :   await cmd_list(args);     break;
        case "job"              :   await cmd_job(args);      break;
        default:
            console.log("Invalid usage: no such subcommand");
            console.log(USAGE);
            process.exit(1);
    }
    process.exit(0);
}



async function cmd_exclude(args:string[]):Promise<number> {
    let confirm = !args.includes('--force');
    let exclude_name;
    if (args[0]) {
        exclude_name = args[0];
    } else {
        console.log("First Argument Missing!");
        console.log(USAGE);
        return 1;
    }

    let searchdir:string = process.env.PWD;
    if (args[1] && args[1] != '--force') {
        searchdir = args[1];
    }
    if (searchdir.includes("~")) {
        searchdir.replace("~", process.env.HOME)
    }

    let m = await getMatches();
    if (confirm) { 
        if ((await question_async("Confirm (y/N)?")).toLowerCase() != 'y') { return 1; }
    }
    let pl_f = generateNewPlist(m);
    writePlist(pl_f);
    restartMDS();
    finalMessage();
    return 0;

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

async function cmd_unexclude(args:string[]): Promise<number> {

    let confirm = !args.includes('--force');
    let exclude_name;
    if (args[0]) {
        exclude_name = args[0];
    } else {
        console.log("First Argument Missing!");
        console.log(USAGE);
        return 1;
    }
    
    let searchdir:string = process.env.PWD;
    if (args[1] && args[1] != '--force') {
        searchdir = args[1];
    }
    if (searchdir.includes("~")) {
        searchdir.replace("~", process.env.HOME)
    }


    let plf;
    try { plf = fs.readFileSync(PLIST_PATH); } catch(e) {
        throw new Error('Unable to read spotlight plist at ' + PLIST_PATH + '\nAre you sure you are running as sudo ?\n'+
                           'In future versions of macOS beyond 11.2 (Big Sur) the plist path may have moved.');
    }

    let p = plist.parse(plf.toString());

    let excscopy: string[] = JSON.parse(JSON.stringify(p['Exclusions']));
    let newexcs = [];
    let rming = [];
    let re = globToRegExp(searchdir+"/**/"+exclude_name);
    
    for (let exc of excscopy) {
        if (!re.test(exc)) {
            newexcs.push(exc);
        } else {
            rming.push(exc);
        }
    }

    p['Exclusions'] = newexcs;
   
    for (let r of rming) { console.log(r); }
    console.log("Found ("+rming.length+") excluded dirs that match the expression:");
    console.log(searchdir+"/**/"+exclude_name);

    if (confirm) {
        if ((await question_async("\nRemove all from Spotlight excluded list? (y/N)")).toLowerCase() != 'y') { return 1; }
    }
    fs.writeFileSync(PLIST_PATH, plist.build(p));
    return 0;
}




async function cmd_job(args:string[]): Promise<number> {
    let es = get_excludes();
    for (let e of es) {
        if (e.length < 1) { continue; }
        let name = e.split(" ~~~ ")[0];
        let base = e.split(" ~~~ ")[1];
        await cmd_exclude([name, base, "--force"]);
    }
    return 0;
}
function cmd_add(args:string[]) {
    let toadd = get_exclude_info(args);
    let line = toadd.name + " ~~~ " + toadd.base
    let es = get_excludes();
    if (es.includes(line)) { throw new Error('This rule already exists in the excludes file.'); }
    es.push(line);
    set_excludes(es);
}
function cmd_remove(args:string[]) {
    let ex = get_exclude_info(args);
    let line = ex.name + " ~~~ " + ex.base;
    let es = get_excludes();
    let newlist = [];
    for (let e of es) {
        if (e.length < 1) { continue; }
        if (e != line) {
            newlist.push(e);
        }
    }
    set_excludes(newlist);
}
function cmd_list(args:string[]) {
    // TODO: full option
    let es = get_excludes();
    for (let l of es) {
        if (l.length < 1) { continue; }
        let secndstr = l.replace(" ~~~ ", " inside of: ");
        console.log("Searching for " + secndstr);
    }
}

function get_exclude_info(args:string[]):{ name:string, base:string }  {
    let exclude_name;
    if (args[0]) {
        exclude_name = args[0];
    } else {
        console.log("First Argument Missing!");
        console.log(USAGE);
        throw new Error("Invalid argument.");
    }

    let searchdir:string = process.env.PWD;
    if (args[1] && args[1] != '--force') {
        searchdir = args[1];
    }
    if (searchdir.includes("~")) {
        searchdir.replace("~", process.env.HOME)
    }
    return { name:exclude_name, base:searchdir };
}


let fname = ".spotlight-manager";
let dfpath = process.env.HOME + "/" + fname
function get_excludes():string[] {
    if (!fs.existsSync(dfpath)) { fs.writeFileSync(dfpath, ""); }
    let dotfs = fs.readFileSync(dfpath).toString().split('\n');
    return dotfs;
}
function set_excludes(excludes:string[]) {
    let s = "";
    for (let e of excludes) {
        s+=e+"\n";
    }
    fs.writeFileSync(dfpath, s);
}

main();