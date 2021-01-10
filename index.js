#!/usr/local/bin/node

// TODO: Filter nested paths, ex node_modules with node_modules inside. Those don't need to double filter. 

const readline = require("readline");
const { exec } = require("child_process");
const path_module = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Check for args

let path = process.env.PWD;
if (process.argv[2]) {
	path = process.argv[2];
}

let exclude_name = "node_modules";
if (process.argv[3]) {
	exclude_name = process.argv[3];
}


let pledit = "/usr/libexec/PlistBuddy";
let plistOperation = (op, pass, callback) => {
	exec(`printf "` + pass + `\n" | sudo -S ` + pledit + ` ` + op, function(a,b,c) { callback(a,b,c); });
}

rl.question("Search for directories matching " + exclude_name + " in " + path + " ? (y/n) ", function(a1) {
	if (a1.toUpperCase() != "Y") { process.exit(0); }
	
	rl.question("Password:", function(pass) {
		rl.stdoutMuted = false;
		rl.history = rl.history.slice(1);
		console.log("\nScanning...\n");

		exec(`printf "` + pass + `\n" | sudo -S find ` + path + ` -type d -name '` + exclude_name + `' -prune`, function(err, out, serr) {
			if (err) { console.log(serr); process.exit(1); }

			// We have list of dirs, now to alter system prefs
			let dirsNoFilter = out.split('\n');
			let dirs = []

			for (let d of dirsNoFilter) {
				if (d.includes(exclude_name)) {
					dirs.push(d);
				}
			}

			console.log('Found: ');
			console.log(dirs);

			let plistDir = "/System/Volumes/Data/.Spotlight-V100/VolumeConfiguration.plist";

			// get current list of excluded dirs
			plistOperation('-c "Print :Exclusions" ' + plistDir, pass, function(plerr, plout, plserr) {
				let plistDirsNoFilter = plout.split('\n');
				let plistDirs = [];
				for (let p of plistDirsNoFilter) {
					if ((p == '') || (p == 'Array {') || (p == '}')) {
					} else {
						plistDirs.push(p.match(/\S.*/gm)[0]); // take out front spaces
					}
				}

				let diffDirs = [];
				for (let newDir of dirs) {
					let newResolved = path_module.resolve(newDir);
					let isDifferent = true;
					for (let plDir of plistDirs) {
						if (path_module.resolve(plDir) == newResolved) {
							isDifferent = false;	
						}
					}
					if (isDifferent) {
						diffDirs.push(newDir);
					}
				}
				console.log("\nNot already excluded:");
				for (let d of diffDirs) { console.log(d); }
				console.log("\n");
				console.log(diffDirs.length + " directories were found that match the name " + exclude_name + " inside of " + path + " that are not already present in Spotlight's exclude list.");
				if (diffDirs.length == 0) {
					process.exit(0);
				} else {
					rl.question("\nWould you like to append these (" + diffDirs.length + ") item(s) to VolumeConfiguration.plist?\nThis tells Spotlight to ignore these directories. (y/n) ", function(edit) {
						if (edit.toUpperCase() != "Y") { process.exit(0); }

						for (let d of diffDirs) {
							if (d.includes(exclude_name)) {
								plistOperation('-c "Add :Exclusions: string ' + d + '" ' + plistDir, pass, function(adderr, ao, asr) { if (adderr) { console.log(asr); } }); 
							}
						}
						exec(`printf "` + pass + `\n" | sudo -S launchctl stop com.apple.metadata.mds`);
						exec(`printf "` + pass + `\n" | sudo -S launchctl start com.apple.metadata.mds`);
						rl.question("Done. Double check in System Preferences > Spotlight > Privacy to verify manually? (y/n) ", function(verify) {
							if (verify.toUpperCase() != "Y") { process.exit(0); }
							exec('open -b com.apple.systempreferences /System/Library/PreferencePanes/Spotlight.prefPane');
							process.exit(0);
						});
					});
				}
			});
		});
	});

	// mute stdout for PW
	rl.stdoutMuted = true;
	rl._writeToOutput = function _writeToOutput(stringToWrite) {
  		if (rl.stdoutMuted)
			rl.output.write('*');
		else
    			rl.output.write(stringToWrite);
	};

});



