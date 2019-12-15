/**
 * Pone Downlaoder
 * By @ZoeyLovesMiki
 */

// Imports
let fs = require('fs'),
    path = require('path'),
    axios = require('axios'),
    cheerio = require('cheerio'),
    progress = require('progress');

// Array with all the links/files to download
let links = [];

// Base url for yay ponies episodes
const base_url = "https://yp1.yayponies.no/videos/tables/";

// Number of seasons
const seasons_count = 9;

// Folder to extract to
const output_folder = "M:/TV Shows/My little pony/";

async function fetchLinks(pos) {
    // Url to download
    let url = `${base_url}1s${pos}.html`;

    // Get HTML via axios
    let response = await axios.get(url);

    // Parse it using cheerio
    let page = cheerio.load(response.data);

    // Get our direct download urls
    let urls = page("a[href^='https://yp']").get();

    // Go through each a tags and get the href/url
    urls.forEach((url) => {
        links.push(url.attribs.href)
    });

    if (pos + 1 > seasons_count) {
        console.log("Time to download the episodes...");
        downloadEpisodes()
    } else {
        fetchLinks(pos + 1);
    }
}

async function downloadEpisodes() {
    if (links.length == 0) {
        console.log("Done downloading!");
        return;
    }

    // Get our episode to download
    let episode = links.shift();

    // File path
    let file = path.resolve(output_folder, path.basename(episode));

    // Skip if the file already exists
    if (fs.existsSync(file)) {
        console.log(`${path.basename(episode)} already exists, skipping...`);
        downloadEpisodes();
        return;
    }

    console.log(`Downloading ${path.basename(episode)}!`);

    // Axios request
    let { data, headers } = await axios({
        url: episode,
        method: 'GET',
        responseType: 'stream'
    });

    // Size of our episode to download
    let length = headers['content-length']

    // Create a progress bar
    let progressBar = new progress('-> progress [:bar] :percent :etas', {
        width: 40,
        complete: '=',
        incomplete: ' ',
        renderThrottle: 1,
        total: parseInt(length)
    });

    // Create our output file
    let writer = fs.createWriteStream(file);

    // Pipe progress to the progressbar
    data.on('data', (chunk) => progressBar.tick(chunk.length));

    // Pipe data to the file writer
    data.pipe(writer)

    // Download is done
    writer.on('finish', () => {
        downloadEpisodes();
    });
}

console.log("Fetching the episodes URLs...");
fetchLinks(1);