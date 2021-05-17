import plist from 'plist';
import fs from 'fs';

let f = fs.readFileSync("/Users/ankushgirotra/Library/LaunchAgents/com.google.keystone.agent.plist").toString();



let pl = {
    "Label": "com.spotlightmanager.user.agent",
    "LimitLoadToSessionType": "Aqua",
    "ProgramArguments": [
        "/Users/ankushgirotra/Library/Google/GoogleSoftwareUpdate/GoogleSoftwareUpdate.bundle/Contents/Resources/GoogleSoftwareUpdateAgent.app/Contents/MacOS/GoogleSoftwareUpdateAgent",
        "-runMode",
        "ifneeded"
    ],
    "RunAtLoad": true,
    "StartInterval": 3623,
    "StandardErrorPath": "/dev/null",
    "StandardOutPath": "/dev/null"
};


let pl2 = {
    "Label": "com.user.spotlightManager",
    "ProgramArguments": [
        "spotlight-manager",
        "exclude",
        "node_modules",
        "~/Documents/",
        "--force"
    ],
    "StartCalendarInterval": [
        {
            "Second": 0
        },
        {
            "Second": 10
        },
        {
            "Second": 20
        },
        {
            "Second": 30
        },
        {
            "Second": 40
        },
        {
            "Second": 50
        },
    ],
    "StandardErrorPath": "/Users/ankushgirotra/.spotlight-manager/err.log",
    "StandardOutPath": "/Users/ankushgirotra/.spotlight-manager/out.log",
    "EnvironmentVariables": {
        "PATH": "/usr/local/bin:/usr/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin"
    }
}

let pl3 = {
    "Label": "com.user.spotlightManager",
    "ProgramArguments": [
        "spotlight-manager",
        "exclude",
        "node_modules",
        "~/Documents/",
        "--force"
    ],
    "StartCalendarInterval": [
        {
            "Second": 0
        },
        {
            "Second": 10
        },
        {
            "Second": 20
        },
        {
            "Second": 30
        },
        {
            "Second": 40
        },
        {
            "Second": 50
        },
    ],
    "StandardErrorPath": "/Users/ankushgirotra/.spotlight-manager/err.log",
    "StandardOutPath": "/Users/ankushgirotra/.spotlight-manager/out.log",
    "EnvironmentVariables": {
        "PATH": "/usr/local/bin:/usr/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin"
    }
}




console.log(plist.build(pl2));

console.log(JSON.stringify(plist.parse(`
`)));