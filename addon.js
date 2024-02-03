const { addonBuilder } = require("stremio-addon-sdk");

let WMTWStreamType = ''; // Declare the global variable
let WMTWProgramTitle = ''; // Declare the global variable
let globalESTTime = ''; // Global variable to store the EST time

function UpdateGlobalESTTime() {
  const currentDate = new Date();

  // Convert to Eastern Standard Time (EST)
  const estOptions = { timeZone: 'America/New_York' };
  globalESTTime = currentDate.toLocaleString('en-US', estOptions);
}

const https = require('https');

async function GetWMTWStreamURL() {
  try {
    const apiUrl = "https://varstore.mccutcheon.workers.dev/?VarName=WMTW_JSON";
	
    const jsonData = await new Promise((resolve, reject) => {
      const req = https.get(apiUrl, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
	});

    UpdateGlobalESTTime();

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
      WMTWStreamType = 'Demand';
    }

    UpdateGlobalESTTime();
    console.log(`${globalESTTime} | WMTW Data Updated! | Stream: ${stream} | Stream Type: ${WMTWStreamType}`);
  } else {
    console.log(`${globalESTTime} | Channel not found with ID:`, ID);
  }
}

let RADIO_DATA = [
    {
        "genres": ["News", "Weather", "Local Events"],
        "id": "MaineLocalNews-89960945772534639607784459421582",
        "name": "WMTW Channel 8",
        "poster": "https://kubrick.htvapps.com/htv-prod-media.s3.amazonaws.com/htv_default_image/wmtw/top_image.png?resize=1200:*",
        "url": 'https://example.com/',
        "description": "Maine's Total [Weather/News/Coverage] goes live on weekdays at 4:30 AM, 5 AM, 6 AM, 12 PM, 4 PM, 5 PM, 6 PM, 10 PM, and 11 PM, as well as on weekends at 5 AM, 6 AM, 7 AM, 6 PM, 10 PM, and 11 PM. In addition to the live broadcasts, there are replays of the previous newscasts available 24/7, ensuring that viewers can catch up on the latest coverage outside of the scheduled live broadcasting times."
    },
    {
        "genres": ["News", "Weather", "Sports", "Local Events"],
        "id": "MaineLocalNews-79753841561804236567228490214450",
        "name": "WGME Channel 13",
        "poster": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fis4-ssl.mzstatic.com%2Fimage%2Fthumb%2FPurple113%2Fv4%2Fa6%2Fba%2F72%2Fa6ba7200-ffad-1087-d10f-4457e9b4f828%2Fsource%2F512x512bb.jpg&f=1&nofb=1&ipt=dc1b762e253ede84b2cf8e0d93016d95965124bf44dc7ea4072e9ae33ad1dff8&ipo=images",
        "url": "https://content.uplynk.com/channel/26e532a9a241468794d8655f0cf4ad79.m3u8",
        "description": "WGME Channel 13 provides live broadcasts throughout the week, airing on weekdays during various time slots: 2:12 AM - 4:00 AM, 4:00 AM - 4:30 AM, 4:30 AM - 7 AM, 12 PM - 12:30 PM, 5 PM - 5:30 PM, 5:30 PM - 6 PM, 6 PM - 6:30 PM, 7 PM - 7:30 PM, and 11 PM - 11:35 PM. On Saturdays, live programming is available from 8:00 AM - 10:00 AM, 6:00 PM - 6:30 PM, 6:30 PM - 7:00 PM, and 11:00 PM - 11:30 PM. Sundays feature live broadcasts at 9:00 AM - 10:30 AM and 11:00 PM - 11:30 PM. Replays of content are scheduled from Tuesday to Saturday, running from 1:37 AM to 2:12 AM. It's noteworthy that outside of these designated times and during commercial breaks, viewers will more than likely experience dead air; however, in the intervals between live broadcasts, the channel may occasionally choose to play a replay of a newscast."
    },
    {
        "genres": ["News", "Weather", "Traffic", "Sports", "Local Events", "Entertainment"],
        "id": "MaineLocalNews-75582199619481153474745930391197",
        "name": "News Center Maine",
        "poster": "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fcontent.wcsh6.com%2Fphoto%2F2018%2F01%2F04%2FYouTube_2560x1440_NCM_1515107231609_12174744_ver1.0.png&f=1&nofb=1&ipt=2474af7277f4158556a534d6e0c11de458e590cd9b5434d104da48e760935028&ipo=images",
        "url": "https://video.tegnaone.com/ncm/live/v1/manifest/f9c1bf9ffd6ac86b6173a7c169ff6e3f4efbd693/NCM-Production/4817cbdc-f8bd-4584-a7e1-746cc3cc26f7/0.m3u8",
        "description": "News Center Maine airs live on weekdays during multiple time slots: 4:30 AM - 5:00 AM, 5:00 AM - 7:00 AM, 12:00 PM - 12:30 PM, 4:00 PM - 5:00 PM, 5:00 PM - 5:30 PM, 5:30 PM - 6:00 PM, 6:00 PM - 6:30 PM, and 11:00 PM - 11:35 PM. On Saturdays, the live broadcasts occur at 5:00 AM - 7:00 AM, 6:00 PM - 6:30 PM, and 11:00 PM - 11:30 PM, while on Sundays, viewers can tune in at 6:00 AM - 8:00 AM, 6:00 PM - 6:30 PM, and 11:00 PM - 11:30 PM. Replays of the content are available every day from 1:36 AM to 2:11 AM. The remaining time slots feature a blend of news and entertainment programming."
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
            if (WMTWStreamType === 'Demand') {
                title += ' - Demand';
            } else {
                title += ' - Live';
            }
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
    "name": "Maine News",
    "description": "Stremio Add-On to Watch Maine Local News Stations",
    "types": ["Local News"],
    "catalogs": [
        {
            "type": "Local News",
            "id": "LocalNews",
            "name": "Channels",
            "extra": [
                { "name": "search", "isRequired": false }, 
                { "name": "genre", "isRequired": false}
            ],
            "genres": getGenres()
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
            const genreFilter = args.extra && args.extra.genre ? args.extra.genre.toLowerCase() : '';
            
            const catalog = getCatalog().filter(item => {
                const nameMatches = item.name.toLowerCase().includes(searchQuery);
                const genreMatches = item.genres && item.genres.some(genre => genre.toLowerCase().includes(genreFilter));
                return nameMatches && (genreFilter === '' || genreMatches);
            });

            const metaPreviews = {
                'metas': catalog.map(item => ({
                    'id': item['id'],
                    'type': "Local News",
                    'name': item['name'],
                    'genres': item['genres'],
                    'poster': item['poster'],
                    'description': item['description'],
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

// Function to Update WMTW with a dynamic interval
const startDynamicInterval = async () => {
    await UpdateWMTWStreamUrl();
    const dynamicLoop = async () => {
        const getTimestamp = () => {
            const currentDate = new Date();
            const estTimestamp = currentDate.toLocaleString('en-US', { timeZone: 'America/New_York' });
            return estTimestamp;
        };
        const timestamp = getTimestamp();
        const checkAndUpdate = async () => {
            const currentDate = new Date();
            const minutes = currentDate.getMinutes();
            if (minutes % 15 === 0) {
                await UpdateWMTWStreamUrl();
            }
        };
        await checkAndUpdate();
        const currentDate = new Date();
        const minutes = currentDate.getMinutes();
        const seconds = currentDate.getSeconds();
        const minutesUntilNextUpdate = (30 - (minutes % 30)) % 30 - 1;
        const secondsUntilNextUpdate = 60 - seconds;
        const remainingTime = minutesUntilNextUpdate * 60 * 1000 + secondsUntilNextUpdate * 1000;
        const dynamicInterval = Math.max(remainingTime , 15000);
        const estNextDynamicInterval = new Date(Date.now() + dynamicInterval).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: true });
        console.log(`${timestamp} - Next dynamic interval is scheduled for ${estNextDynamicInterval}.`);
        setTimeout(dynamicLoop, dynamicInterval);
    };
        dynamicLoop();
    };
  
  startDynamicInterval();

module.exports = builder.getInterface();