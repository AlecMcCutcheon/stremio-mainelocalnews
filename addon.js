const { addonBuilder } = require("stremio-addon-sdk");
const axios = require('axios');
const express = require('express');
const cors = require('cors');

let WMTWStreamType = ''; // Declare the global variable
let WMTWProgramTitle = ''; // Declare the global variable
let globalESTTime = ''; // Global variable to store the EST time

function UpdateGlobalESTTime() {
  const currentDate = new Date();

  // Convert to Eastern Standard Time (EST)
  const estOptions = { timeZone: 'America/New_York' };
  globalESTTime = currentDate.toLocaleString('en-US', estOptions);
}

const proxy = express();

//  Local On-Demand Cors Proxy to Fetch JSON Data from 'https://www.wmtw.com/nowcast/status'
const startProxy = function (port = 8010, proxyPartial = '/proxy', credentials = false, origin = '*', customDNSResolver = '8.8.8.8') {
    const proxyUrl = 'https://www.wmtw.com'; // Replace with your default proxy URL
    proxy.use(cors({ credentials: credentials, origin: origin }));
    proxy.options('*', cors({ credentials: credentials, origin: origin }));
    const cleanProxyUrl = proxyUrl.replace(/\/$/, '');
    const cleanProxyPartial = proxyPartial.replace(/\//g, '');
    
    proxy.use('/' + cleanProxyPartial, async function (req, res) {
        try {
            // Use custom DNS resolver for this specific request
            const axiosConfig = {
                method: 'get',
                url: cleanProxyUrl + req.url,
                responseType: 'json',
                dns: {
                    resolver: customDNSResolver
                }
            };

            const response = await axios(axiosConfig);

            const accessControlAllowOriginHeader = response.headers['access-control-allow-origin'];
            if (accessControlAllowOriginHeader && accessControlAllowOriginHeader !== origin) {
                response.headers['access-control-allow-origin'] = origin;
            }

            res.send(response.data);
        } catch (error) {
            UpdateGlobalESTTime();
            console.error(`${globalESTTime} | Error proxying request:`, error);
            res.status(500).send('Internal Server Error');
        }
    });

    return proxy.listen(port);
};

async function GetWMTWStreamURL() {
    try {
        const apiUrl = 'http://localhost:8010/proxy/nowcast/status';

        const server = startProxy();

        const response = await axios.get(apiUrl);
        const jsonData = response.data;
        UpdateGlobalESTTime();
        console.log(`${globalESTTime} | WMTW Data:`, jsonData.data);
        server.close();

        let streamUrl = jsonData.data.stream;
        const indexOfM3U8 = streamUrl.indexOf('.m3u8');
        if (indexOfM3U8 !== -1) {
            streamUrl = streamUrl.substring(0, indexOfM3U8 + 5);
        }

        return {
            stream: streamUrl,
            seconds_until_live: jsonData.data.seconds_until_live,
            programTitle: jsonData.data.programTitle
        };
    } catch (error) {
        UpdateGlobalESTTime();
        console.error(`${globalESTTime} | Error fetching or processing data:`, error);
        return null;
    }
}

async function UpdateWMTWStreamUrl() {
    const ID = "MaineLocalNews-89960945772534639607784459421582";
    const channelToUpdate = RADIO_DATA.find(channel => channel.id === ID);

    if (channelToUpdate) {
        const { stream, seconds_until_live, programTitle } = await GetWMTWStreamURL();
        channelToUpdate.url = stream;
        WMTWProgramTitle = programTitle;

        if (seconds_until_live === 0) {
            WMTWStreamType = 'Live';
        } else {
            WMTWStreamType = 'Replay';
        }

        UpdateGlobalESTTime();
        console.log(`${globalESTTime} | WMTW Data Updated! Stream Type: ${WMTWStreamType}`);
    } else {
        console.log(`${globalESTTime} | Channel not found with ID:`, ID);

    }
}

let RADIO_DATA = [
    {
        "genres": ["Maine News", "Weather"],
        "id": "MaineLocalNews-89960945772534639607784459421582",
        "name": "WMTW Channel 8",
        "poster": "https://kubrick.htvapps.com/htv-prod-media.s3.amazonaws.com/htv_default_image/wmtw/top_image.png?resize=1200:*",
        "url": 'https://example.com/',
        "description": "Maine's Total [Weather|News|Coverage] is Live on: Weekdays at (4:30 AM, 5 AM, 6 AM, 12 PM, 4 PM, 5 PM, 6 PM, 10 PM, and 11 PM) | Weekends at (5 AM, 6 AM, 7 AM, 6 PM, 10 PM, and 11 PM) with replays of the latest newscasts available 24/7."
    },
    {
        "genres": ["Maine News", "Weather", "Traffic", "Sports", "Other Topics"],
        "id": "MaineLocalNews-75582199619481153474745930391197",
        "name": "News Center Maine",
        "poster": "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fcontent.wcsh6.com%2Fphoto%2F2018%2F01%2F04%2FYouTube_2560x1440_NCM_1515107231609_12174744_ver1.0.png&f=1&nofb=1&ipt=2474af7277f4158556a534d6e0c11de458e590cd9b5434d104da48e760935028&ipo=images",
        "url": "https://video.tegnaone.com/ncm/live/v1/manifest/f9c1bf9ffd6ac86b6173a7c169ff6e3f4efbd693/NCM-Production/4817cbdc-f8bd-4584-a7e1-746cc3cc26f7/0.m3u8",
        "description": "News Center Maine is Live: 24/7."
    }
];

const getStreams = () => {
    const streams = {};
    const wmtwId = "MaineLocalNews-89960945772534639607784459421582";
    RADIO_DATA.forEach(entry => {
        let title = `Watch ${entry["name"]}`;
        const type = entry["ytId"] ? 'ytId' : 'url';
        if (entry["id"] === wmtwId) {
            title = WMTWProgramTitle;
            if (WMTWStreamType === 'Replay') {
                title += ' - Replay';
            } else {
                title += ' - Live';
            }
        }else {
            title += ' - Live';
        }
        streams[entry["id"]] = {
            'title': title,
            [type]: entry[type] || entry["url"],
        };
    });
    return streams;
};

const getCatalog = () => {
    const catalog = RADIO_DATA.map(entry => ({
        "id": entry["id"],
        "name": entry["name"],
        "genres": entry["genres"],
        "poster": entry["poster"],
        "description": entry["description"],
    }));
    return catalog;
};

const getGenres = () => {
    const genres = new Set();
    RADIO_DATA.forEach(item => {
        item["genres"].forEach(genre => genres.add(genre));
    });
    return [...genres];
};

const manifest = {
    "id": "com.mixtape.stremiomainelocalnews",
    "version": "1.0.0",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Flag_of_the_State_of_Maine.svg/761px-Flag_of_the_State_of_Maine.svg.png",
    "name": "Maine Local News",
    "description": "Stremio Add-On to Watch Maine Local News Stations",
    "types": ["Local News"],
    "catalogs": [
        {
            "type": "Local News",
            "id": "MaineLocalNews",
            "name": "Maine Local News",
            "extra": [{ "genres": getGenres() }]
        }
    ],
    "resources": [
        "catalog",
        "meta",
        "stream"
    ],
    "idPrefixes": [""]
};


const builder = new addonBuilder(manifest);

builder.defineCatalogHandler((args) => {
    return new Promise((resolve, reject) => {
        try {
            const searchQuery = args.extra && args.extra.search ? args.extra.search.toLowerCase() : '';
            const catalog = getCatalog().filter(item => item.name.toLowerCase().includes(searchQuery));

            const metaPreviews = {
                'metas': catalog.map(item => ({
                    'id': item['id'],
                    'type': "Local News",
                    'name': item['name'],
                    'genres': item["genres"],
                    'poster': item["poster"],
                    'description': item["description"],
                }))
            };
            resolve(metaPreviews);
        } catch (error) {
            UpdateGlobalESTTime();
            console.error(`${globalESTTime} | Error in defineCatalogHandler:`, error);
            reject(error);
        }
    });
});

builder.defineMetaHandler((args) => {
    return new Promise((resolve, reject) => {
        try {
            const mkItem = item => ({
                'id': item['id'],
                'type': "Local News",
                'name': item['name'],
                'genres': item['genres'],
                'poster': item["poster"],
                'background': item["poster"],
                'posterShape': "square",
                'description': item["description"],
            });

            const meta = {
                'meta': mkItem(getCatalog().find(item => item['id'] === args.id)),
            };
            resolve(meta);
        } catch (error) {
            UpdateGlobalESTTime();
            console.error(`${globalESTTime} | Error in defineMetaHandler:`, error);
            reject(error);
        }
    });
});

builder.defineStreamHandler((args) => {
    return new Promise((resolve, reject) => {
        try {

            (async () => {
                const streams = { 'streams': [] };
                if (args.id in getStreams()) {
                    streams['streams'].push(getStreams()[args.id]);
                }
                resolve(streams);
            })();

        } catch (error) {
            UpdateGlobalESTTime();
            console.error(`${globalESTTime} | Error in defineStreamHandler:`, error);
            reject(error);
        }
    });
});

const runUpdateWMTWStreamUrl = async () => {
    try {
      await UpdateWMTWStreamUrl();
    } catch (error) {}
  };
  
  const logTimeUntilNext30Minutes = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
  
    // Calculate the time until the next 30-minute mark
    const timeUntilNext30Minutes = (30 - (minutes % 30)) * 60 * 1000 - seconds * 1000 - milliseconds;
  
    // Convert milliseconds to a human-readable format
    const timeString = new Date(timeUntilNext30Minutes).toISOString().substr(11, 8);
  
    UpdateGlobalESTTime();
    console.log(`${globalESTTime} | Time until next 30 minute Sync Mark: ${timeString}`);
  };
  
  const runEvery30Minutes = async () => {
    await runUpdateWMTWStreamUrl(); // Run the update function at the start
  
    logTimeUntilNext30Minutes();
  
    // Set up the interval to log the time until the next 30 minutes (for demonstration purposes)
    setInterval(logTimeUntilNext30Minutes, 5 * 60 * 1000); // Log every 5 minutes for demonstration
  
    // Initial delay to align the execution with the next 30-minute mark
    const timeUntilNext30Minutes = (30 - (new Date().getMinutes() % 30)) * 60 * 1000;
    setTimeout(() => {
      // Run the update function again
      runUpdateWMTWStreamUrl();
      
      // Then set the interval to run every 30 minutes
      setInterval(async () => {
        await runUpdateWMTWStreamUrl();
        logTimeUntilNext30Minutes();
      }, 30 * 60 * 1000);
    }, timeUntilNext30Minutes);
  };
  
  runEvery30Minutes();  

module.exports = builder.getInterface();