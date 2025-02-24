require('./settings.js')
const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios")
const { search, downloadTrack, downloadAlbum } = require("@nechlophomeriaa/spotifydl");
const fetch = require("node-fetch");
const { xnxxSearch, xnxxDownload } = require("@mr.janiya/xnxx-scraper");
const yts = require("yt-search");
const { youtube } = require("btch-downloader");
const { getVideoInfo, downloadVideo, downloadAudio } = require("hybrid-ytdl");
const { randomBytes } = require('crypto');
const fs = require("fs");
const util = require('minecraft-server-util');
const malScraper = require('mal-scraper');

// >~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
const ptz = require('./function/index')
const toRupiah = require('./function/torupiah')
const getBuffer = require('./function/function')

const app = express();
const PORT = process.env.PORT || 3000;

//Middleware
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route utama untuk halaman index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/tes", (req, res) => {
    res.sendFile(path.join(__dirname, "tes.html"));
});

// >~~~~~~~~~~ API ~~~~~~~~~~< //
app.get('/api/downloader/mediafire', async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({
            status: false,
            message: "Masukkan URL MediaFire yang valid! Contoh: /api/downloader/mediafire?url=https://www.mediafire.com/file/qyk2na28cidzt3p/cf2.js/file"
        });
    }

    // Validasi format URL MediaFire
    const mediafireRegex = /^(https?:\/\/)?(www\.)?mediafire\.com\/.+$/i;
    if (!mediafireRegex.test(url)) {
        return res.status(400).json({
            status: false,
            message: "URL tidak valid! Pastikan itu adalah URL dari MediaFire."
        });
    }

    try {
        // Menggunakan API pihak ketiga untuk mendapatkan informasi file
        const response = await axios.post('http://kinchan.sytes.net/mediafire/download', { url });
        const result = response.data;

        // Jika terjadi kesalahan dalam pengambilan data
        if (result.error) {
            return res.status(500).json({
                status: false,
                message: result.error
            });
        }

        res.json({
            status: true,
            creator: `${creator}`,
            results: {
                filename: result.filename,
                size: result.size,
                mimetype: result.mimetype,
                downloadUrl: result.download
            }
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Terjadi kesalahan saat memproses permintaan.",
            error: error.message
        });
    }
});

app.get("/api/downloader/tiktok", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL is required." });

  try {
    const { tiktokdl } = require("tiktokdl");
    const data = await tiktokdl(url);
    if (!data) return res.status(404).json({ error: "No data found." });
    res.json({ status: true, creator: "Fajar Official", result: data });
  } catch (e) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get('/api/downloader/igdl', async (req, res) => {
    try {
        const url = req.query.url;

        if (!url) {
            return res.status(400).json({ error: "Parameter 'url' diperlukan!" });
        }

        if (!url.match(/instagram\.com\/(reel|p|tv)/gi)) {
            return res.status(400).json({ error: "URL harus berupa link Instagram Reel, Post, atau TV!" });
        }

        const result = await ptz.instanav(url);

        if (!result || result.downloadUrls[0] === 'Download URL not found') {
            return res.status(404).json({ error: "Media tidak ditemukan!" });
        }

        res.json({
            title: result.title,
            thumbnail: result.thumbnail,
            downloadUrls: result.downloadUrls
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Terjadi kesalahan dalam memproses permintaan." });
    }
});

app.get("/api/downloader/xnxx", async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ Status: false, message: "Parameter 'url' wajib diisi" });
        }
        
        const result = await xnxxDownload(url);
        
        res.json({
            Status: true,
            Creator: creator,
            results: result
        });
    } catch (error) {
        res.status(500).json({ Status: false, message: "Terjadi kesalahan", error: error.message });
    }
});

app.get("/api/downloader/spotify", async (req, res) => {
    const { query, type } = req.query;

    if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
        let data;
        if (type === "track") {
            data = await downloadTrack(query);
        } else if (type === "album") {
            data = await downloadAlbum(query);
        } else {
            data = await search(query);
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data", details: error.message });
    }
});

app.get('/api/search/tiktok', async (req, res) => {
  const text = req.query.text;  // The search query will be passed in the URL as a query parameter
  
  if (!text) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Please provide a search query. Example: /api/search/tiktoksearch?text=christy+jkt48"
    });
  }

  try {
    const searchResults = await ptz.tiktokSearchVideo(text);
    let result = [];
    let no = 1;

    for (let video of searchResults.videos) {
      let videoData = {
        no: no++,
        title: video.title,
        username: video.author.unique_id,
        nickname: video.author.nickname,
        duration: toRupiah(video.duration) + ' detik',
        like: toRupiah(video.digg_count),
        comment: toRupiah(video.comment_count),
        share: toRupiah(video.share_count),
        url: `https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}`,
        video_url: `https://tikwm.com${video.play}`
      };
      
      result.push(videoData);
    }

    // Responding with the JSON data
    res.json({
      searchQuery: text,
      totalResults: result.length,
      results: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal Server Error",
      message: `Something went wrong: ${err.message}`
    });
  }
});

app.get('/api/search/playstore', async (req, res) => {
    const nama = req.query.nama;

    if (!nama) {
        return res.json({
            status: false,
            message: 'Nama pencarian tidak diberikan!'
        });
    }

    try {
        const hasil = await ptz.PlayStore(nama);
        if (!hasil || hasil.length === 0 || hasil.message) {
            return res.json({
                status: false,
                message: 'Tidak ditemukan hasil untuk pencarian tersebut.'
            });
        }

        const result = hasil.slice(0, 3).map((item, i) => ({
            rank: i + 1,
            nama: item.nama,
            developer: item.developer,
            rating: item.rate,
            link: item.link,
            link_dev: item.link_dev,
            img: item.img
        }));

        res.json({
            status: true,
            creator: `${creator}`,
            result
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.json({
            status: false,
            message: 'Terjadi kesalahan saat mengambil data dari Play Store.'
        });
    }
});

app.get('/api/search/anime', async (req, res) => {
    const nama = req.query.nama;

    if (!nama) {
        return res.json({
            status: false,
            message: "⚠️ *Judul anime-nya mana?* Coba ketik nama anime yang mau dicari ya!"
        });
    }

    try {
        const anime = await malScraper.getInfoFromName(nama).catch(() => null);

        if (!anime) {
            return res.json({
                status: false,
                message: "❌ *Yahh, anime yang Kakak cari gak ketemu...* 🥺 Coba ketik judul yang lebih spesifik ya!"
            });
        }

        let animeInfo = {
            title: anime.title,
            type: anime.type,
            premiered: anime.premiered || '-',
            episodes: anime.episodes || '-',
            status: anime.status || '-',
            genres: anime.genres || '-',
            studios: anime.studios || '-',
            score: anime.score || '-',
            rating: anime.rating || '-',
            ranked: anime.ranked || '-',
            popularity: anime.popularity || '-',
            trailer: anime.trailer || '-',
            url: anime.url || '-',
            synopsis: anime.synopsis || 'Tidak ada deskripsi tersedia.',
            picture: anime.picture || 'default-image-url'
        };

        res.json({
            status: true,
            creator: `${creator}`,
            result: animeInfo
        });

    } catch (error) {
        res.json({
            status: false,
            message: "❌ Terjadi kesalahan saat mencari data anime. Silakan coba lagi."
        });
    }
});

app.get('/api/stalker/npm', async (req, res) => {
  const text = req.query.package;

  if (!text) {
    return res.status(400).json({
      results: {
        message: `⚠️ Gunakan dengan contoh: ?package=axios`
      }
    });
  }

  try {
    const npmInfo = await ptz.npmstalk(text);
    res.json({
      status: true,
      creator: 'Fajar Official',
      results: {
        Package: npmInfo.name,
        VersiTerbaru: npmInfo.versionLatest,
        WaktuTerbit: npmInfo.publishTime,
        DependenciesTerbaru: npmInfo.latestDependencies
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      results: {
        message: `❌ Ada masalah waktu ambil data dari NPM, Kak! Coba lagi nanti ya 🥺`
      }
    });
  }
});

app.get('/api/game/samp', async (req, res) => {
    const { ip, port } = req.query;


    try {
        const serverStatus = await ptz.getServerStatus(ip, port);

        if (serverStatus) {
    
            res.json({
                status: true,
                results: {
                    IPServer: serverStatus.ip,
                    PortServer: serverStatus.port,
                    NamaServer: serverStatus.hostname,
                    PemainOnline: serverStatus.players_online,
                    MaxPemain: serverStatus.max_players,
                    GameMode: serverStatus.gamemode,
                    Map: serverStatus.map_name,
                    Version: serverStatus.version,
                    Weather: serverStatus.weather,
                    Url: serverStatus.web_url,
                    Time: serverStatus.world_time,
                    Players: serverStatus.players
                }
            });
        } else {
            res.status(503).json({ status: false, message: "Server sedang offline/MT." });
        }
    } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).json({ status: false, error: "Terjadi kesalahan saat menghubungi server." });
    }
});

app.get('/api/game/minecraft', async (req, res) => {
    const host = req.query.host;
    const port = parseInt(req.query.port);

    if (!host) {
        return res.status(400).json({ status: false, message: 'Parameter host Dan Port diperlukan' });
    }

    try {
        const data = await util.status(host, port, { timeout: 2000 });

        res.json({
            status: true,
            results: {
                ip: host,
                port: port,
                ping: data.roundTripLatency,
                motd: data.motd.clean,
                online: data.players.online,
                max: data.players.max,
                version: data.version.name,
                protocol: {
                    version: data.version.protocol,
                    name: data.version.name
                },
                players: data.players.sample || [],
                software: data.software || "Unknown",
                hostname: data.srvRecord?.host || "N/A",
                debug: {
                    query: data.query || false,
                    srv: data.srvRecord ? true : false,
                    cachehit: data.favicon ? true : false
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Gagal mendapatkan data server', error: error.message });
    }
});

app.get('/api/islam/niatmaghrib', async (req, res, next) => {
    var text = req.query.page
    
    fetch(encodeURI(`https://raw.githubusercontent.com/zeeoneofficial/My-SQL-Results/master/data/NiatMaghrib.json`))
        .then(response => response.json())
        .then(data => {
            var result = data;
            res.json({
                result
            })
        })
        .catch(e => {
            console.log(e);
            res.json(loghandler.error)
        })
});

app.get('/api/islam/niatisya', async (req, res) => {
    var text = req.query.page
    
    fetch(encodeURI(`https://raw.githubusercontent.com/zeeoneofficial/My-SQL-Results/refs/heads/master/data/NiatIsya.json`))
        .then(response => response.json())
        .then(data => {
            var result = data;
            res.json({
                result
            })
        })
        .catch(e => {
            console.log(e);
            res.json(loghandler.error)
        })
});

app.get('/api/islam/niatashar', async (req, res) => {
    
    fetch(encodeURI(`https://raw.githubusercontent.com/zeeoneofficial/My-SQL-Results/master/data/NiatIsya.json`))
        .then(response => response.json())
        .then(data => {
            var result = data;
            res.json({
                result
            })
        })
        .catch(e => {
            console.log(e);
            res.json(loghandler.error)
        })
});

app.get('/api/islam/niatsubuh', async (req, res) => {
    
    fetch(encodeURI(`https://raw.githubusercontent.com/zeeoneofficial/My-SQL-Results/master/data/NiatShubuh.json`))
        .then(response => response.json())
        .then(data => {
            var result = data;
            res.json({
                result
            })
        })
        .catch(e => {
            console.log(e);
            res.json(loghandler.error)
        })
});

app.get('/api/islam/niatdzuhur', async (req, res) => {
    
    fetch(encodeURI(`https://raw.githubusercontent.com/zeeoneofficial/My-SQL-Results/master/data/NiatDzuhur.json`))
        .then(response => response.json())
        .then(data => {
            var result = data;
            res.json({
                result
            })
        })
        .catch(e => {
            console.log(e);
            res.json(loghandler.error)
        })
});

app.get('/api/islam/niatshalat', async (req, res) => {
    var text = req.query.page
    
    fetch(encodeURI(`https://raw.githubusercontent.com/zeeoneofficial/My-SQL-Results/master/data/dataNiatShalat.json`))
        .then(response => response.json())
        .then(data => {
            var result = data;
            res.json({
                result
            })
        })
        .catch(e => {
            console.log(e);
            res.json(loghandler.error)
        })
});
app.get('/api/downloader/capcut', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({
            Status: false,
            Message: "Parameter 'url' diperlukan!"
        });
    }

    res.json({
        Status: true,
        Creator: creator,
        results: await ptz.capcutdl(url)
    });
});
app.get('/api/stalker/tiktok', async (req, res) => {
    const username = req.query.username;
    
    if (!username) {
        return res.status(400).json({
            Status: false,
            Message: 'Parameter username diperlukan!',
        });
    }

    try {
        const results = await ptz.tiktokStalk(username);
        res.json({
            Status: true,
            Creator: creator,
            results: JSON.parse(results),
        });
    } catch (error) {
        res.status(500).json({
            Status: false,
            Message: 'Terjadi kesalahan pada server',
            Error: error.message,
        });
    }
});

app.get("/api/downloader/play", async (req, res) => {
    const text = req.query.text;
    if (!text) {
        return res.json({
            status: false,
            message: "Masukkan query pencarian. Contoh: /api/downloader/play?text=sephia"
        });
    }

    try {
        const look = await yts(text);
        const convert = look.videos[0];
        if (!convert) {
            return res.json({
                status: false,
                message: "Audio tidak ditemukan"
            });
        }

        if (convert.seconds >= 3600) {
            return res.json({
                status: false,
                message: "Audio lebih dari 1 jam!"
            });
        }

        let audioUrl;
        try {
            audioUrl = await youtube(convert.url);
        } catch (e) {
            console.log("Retrying...");
            audioUrl = await youtube(convert.url);
        }

        const thumbBuffer = await getBuffer(convert.thumbnail);

        res.json({
            status: true,
            creator: "YourName",
            results: {
                title: convert.title,
                source: convert.url,
                audio: audioUrl.mp3,
                thumbnail: convert.thumbnail
            }
        });
    } catch (e) {
        res.json({
            status: false,
            message: `Error: ${e.message}`
        });
    }
});


app.get('/api/downloader/pin/', async (req, res) => {
    const text = req.query.text;

    if (!text) {
        return res.status(400).json({ error: "Enter Query" });
    }

    try {
        const anutrest = await ptz.pinterest(text); // Dapatkan hasil pencarian dari Pinterest
        let selectedImages = anutrest.slice(0, 5); // Ambil 5 gambar pertama

        // Format respons JSON
        let messages = selectedImages.map(url => ({
            image: url,
            caption: `⭔ Media Url: ${url}`
        }));

        res.json({
            success: true,
            message: '✅ 5 Gambar Pinterest berhasil dikirim!',
            data: messages
        });
    } catch (error) {
        res.status(500).json({ error: "Terjadi kesalahan", details: error.message });
    }
});

app.get("/api/downloader/ytmp4", async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ Status: false, message: "URL parameter is required" });
    }
    
    try {
        const info = await getVideoInfo(url);
        if (!info.status) return res.status(400).json({ Status: false, message: "Failed to get video info" });

        const video = await downloadVideo(url, "720");
        if (!video.status) return res.status(400).json({ Status: false, message: "Failed to get video download link" });

        res.json({
            Status: true,
            Creator: creator,
            title: info.title,
            uploader: info.creator,
            duration: info.duration,
            source: video.source,
            downloadUrl: video.downloadUrl
        });
    } catch (error) {
        res.status(500).json({ Status: false, message: "Error processing request", error: error.message });
    }
});

app.get("/api/downloader/ytmp3", async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ Status: false, message: "URL parameter is required" });
    }
    
    try {
        const info = await getVideoInfo(url);
        if (!info.status) return res.status(400).json({ Status: false, message: "Failed to get video info" });

        const audio = await downloadAudio(url, "128");
        if (!audio.status) return res.status(400).json({ Status: false, message: "Failed to get audio download link" });

        res.json({
            Status: true,
            Creator: creator,
            title: info.title,
            uploader: info.creator,
            duration: info.duration,
            source: audio.source,
            downloadUrl: audio.downloadUrl
        });
    } catch (error) {
        res.status(500).json({ Status: false, message: "Error processing request", error: error.message });
    }
});


// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
