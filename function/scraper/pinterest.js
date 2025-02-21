const gis = require("g-i-s");

async function pinterest(query) {
    return new Promise((resolve, reject) => {
        gis({ searchTerm: query + ' site:id.pinterest.com' }, (error, results) => {
            if (error) {
                return reject({ status: 404, message: "Terjadi kesalahan" });
            }
            let images = results.map(item => item.url);
            resolve(images);
        });
    });
}

module.exports = pinterest;
