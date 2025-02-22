const axios = require("axios");
const cheerio = require("cheerio");

async function ytVideo(url) {
    try {
        let { data } = await axios.get(`https://10downloader.com/download?v=${encodeURIComponent(url)}&lang=en&type=video`);
        let $ = cheerio.load(data);

        const videoDetails = {
            title: $(".info .title").text().trim(),
            thumbnail: $(".info img").attr("src"),
            duration: $(".info .duration").text().replace("Duration:", "").trim(),
            videoUrl: $("#video-downloads .downloadsTable tbody tr:first-child td:nth-child(4) a").attr("href") || "",
        };

        return videoDetails;
    } catch (error) {
        throw new Error("Failed to fetch video details");
    }
}

module.exports = ytVideo;
