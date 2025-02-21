const SampQuery = require('samp-query');

async function getServerStatus(ip, port) {
    return new Promise((resolve, reject) => {
        const options = {
            host: ip,
            port: parseInt(port, 10),
            timeout: 3000
        };

        SampQuery(options, (error, response) => {
            if (error) {
                console.error("Error detail:", error);
                return reject(null);
            }

            if (!response) {
                return reject(null);
            }

            resolve({
                ip: options.host,
                port: options.port,
                hostname: response.hostname || "Tidak diketahui",
                players_online: response.online || 0,
                max_players: response.maxplayers || 0,
                gamemode: response.gamemode || "Tidak diketahui",
                map_name: response.mapname || "Tidak diketahui",
                version: response.rules?.version || "Tidak diketahui",
                weather: response.rules?.weather || "Tidak diketahui",
                web_url: response.rules?.weburl || "Tidak diketahui",
                world_time: response.rules?.worldtime || "Tidak diketahui",
                players: response.players?.map(player => player.name) || []
            });
        });
    });
}

module.exports = getServerStatus;
