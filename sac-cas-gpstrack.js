
window.addEventListener('load', function() {
    clean();
    // only for logged in users and for route page
    const route = new Route(window.location.pathname);
    if(userLoggedIn() && route.id) {
        addButton(route);
    }
});

function userLoggedIn() {
    return document.getElementsByClassName("m-header__logout-button").length > 0;
}

function clean() {
    // clean button
    const buttons = document.getElementsByClassName("sac-cas-gpstrack-button");
    while (buttons.length > 0) buttons[0].remove();
    // clean link
    const links = document.getElementsByClassName("sac-cas-gpstrack-link");
    while (links.length > 0) links[0].remove();
}

function addButton(route) {
    let el = document.getElementsByClassName("m-map__control-group m-map__control-group--top-right");
    if(el.length) {
        el = el[0];
        const svg = document.createElement("svg");
        svg.setAttribute("aria-hidden", true);
        svg.className = "m-map__control-icon svg";

        const button = document.createElement("button");
        button.className = "m-map__control sac-cas-gpstrack-button";
        button.setAttribute('type', 'button');
        button.textContent = 'GPS';
        button.addEventListener("click", download);
        button.setAttribute("style", "background-color: blanchedalmond;")
        button.setAttribute("data-route-id", route.id);

        el.appendChild(button);
    }
}

function download(event) {
    const routeId = event.target.dataset.routeId;
    const url = `https://www.sac-cas.ch/en/?type=1567765346410&tx_usersaccas2020_sac2020[routeId]=${routeId}`
    fetch(url)
        .then(response => response.json()) // Parse the JSON in the response
        .then(data => {
            let gpx = new GPXString(data.title, data.type, document.location);
            data.segments.map((segment) => {
                if(segment.geom != null && segment.geom.coordinates != null) {
                    gpx.addSegment(segment.geom.coordinates.map(
                        (c) => Swisstopo.toTrkpt(c[1], c[0])
                    ));
                }
            });
            const link = document.createElement('a');
            link.download = `SAC-CAS-${routeId}-${slugify(data.title)}.gpx`;
            link.href = "data:text/json;charset=utf-8," + gpx;
            link.className = "sac-cas-gpstrack-link";
            link.setAttribute("style", "display:none;visibility:hidden");
            document.body.appendChild(link);
            link.click();
            link.remove();
        })
        .catch(error => console.error('Error fetching or processing data:', error));
}

function slugify(str) {
    return str.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const Route = class {
    /**
     * /en/huts-and-tours/sac-route-portal/5028/ski_tour/4205
     * /en/huts-and-tours/sac-route-portal/60/mountain_hiking/1257
     * /en/huts-and-tours/sac-route-portal/rothorn-laemmeren-11049/ski-touring/vom-gemmipass-oder-von-der-laemmerenhuette-ueber-die-n-seite-7235
     * /de/huetten-und-touren/sac-tourenportal/berghaus-maenndlenen-2147000162/berg-und-alpinwandern/von-first-1469/
     * /it/capanne-e-escursioni/portale-escursionistico-del-cas/berghaus-maenndlenen-2147000162/escursionismo-alpino/von-first-1469/
     */
    constructor(path) {
        this.id = false;
        this.destination = false;
        this.path = path.replace(/^\/+|\/+$/g, '').split("/");
        if (this.path.length == 6) {
            this.id = this.parseNum(this.path[5]);
            this.destination = this.parseNum(this.path[3]);
        }
    }
    parseNum(str) {
        if(str.includes("-")) {
            const c = str.split("-");
            return parseInt(c[c.length-1]);
        } else {
            return parseInt(str);
        }
    }
}

const GPXString = class {
    constructor(name, type, src) {
        this.gpx = '<?xml version="1.0" encoding="UTF-8"?>'
        this.gpx += '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="SAC-CAS-GPSTrack">'
        this.gpx += '<trk>';
        this.gpx += `<name>${name}</name>`;
        this.gpx += `<type>${type}</type>`;
        this.gpx += `<src>${type}</src>`;
    }
    addSegment(points) {
        this.gpx += '<trkseg>';
        points.forEach((point) => {
            this.gpx += `<trkpt lat="${point[1]}" lon="${point[0]}"></trkpt>`;
        });
        this.gpx += '</trkseg>';
    }
    toString() {
        this.gpx += '</trk>';
        this.gpx += '</gpx>';
        return this.gpx;
    }
}

const Swisstopo = {
    toTrkpt: function(east, north) {
        if (north >= 1000000 && east >= 1000000) {
            if (north >= 2000000) {
                const big = north;
                north = east - 1000000;
                east = big - 2000000;
            } else if (east >= 2000000) {
                north -= 1000000;
                east -= 2000000;
            } else {
                throw "Number format exception";
            }
        }
        if (north < 0 || north > 1000000 || east < 0 || east > 1000000) {
            throw "Number format exception";
        }
        return Swisstopo.CHtoWGS(east, north);
    },

    WGStoCH: function (lat, lng) {
        return [
            this.WGStoCHy(lat, lng),
            this.WGStoCHx(lat, lng)
        ]
    },

    // Convert WGS lat/lng (° dec) to CH x
    WGStoCHx: function (lat, lng) {
        // Convert decimal degrees to sexagesimal seconds
        lat = this.DECtoSEX(lat);
        lng = this.DECtoSEX(lng);
        
        // Auxiliary values (% Bern)
        const lat_aux = (lat - 169028.66)/10000;
        const lng_aux = (lng - 26782.5)/10000;

        // Process X
        return 200147.07 +
            308807.95 * lat_aux  +
            3745.25 * Math.pow(lng_aux,2) +
            76.63 * Math.pow(lat_aux,2) -
            194.56 * Math.pow(lng_aux,2) * lat_aux +
            119.79 * Math.pow(lat_aux,3);
    },

    // Convert WGS lat/lng (° dec) to CH y
    WGStoCHy: function (lat, lng) {
        // Convert decimal degrees to sexagesimal seconds
        lat = this.DECtoSEX(lat);
        lng = this.DECtoSEX(lng);

        // Auxiliary values (% Bern)
        const lat_aux = (lat - 169028.66)/10000;
        const lng_aux = (lng - 26782.5)/10000;
        
        // Process Y
        return 600072.37 +
            211455.93 * lng_aux -
            10938.51 * lng_aux * lat_aux -
            0.36 * lng_aux * Math.pow(lat_aux,2) -
            44.54 * Math.pow(lng_aux,3);
    },

    CHtoWGS: function (y, x) {
        return [
            this.CHtoWGSlng(y, x),
            this.CHtoWGSlat(y, x),
        ]
    },

    // Convert CH y/x to WGS lat
    CHtoWGSlat: function (y, x) {
        // Converts military to civil and to unit = 1000km
        // Auxiliary values (% Bern)
        const y_aux = (y - 600000)/1000000;
        const x_aux = (x - 200000)/1000000;

        // Process lat
        const lat = 16.9023892 +
              3.238272 * x_aux -
              0.270978 * Math.pow(y_aux, 2) -
              0.002528 * Math.pow(x_aux, 2) -
              0.0447       * Math.pow(y_aux, 2) * x_aux -
              0.0140       * Math.pow(x_aux, 3);

        // Unit 10000" to 1 " and converts seconds to degrees (dec)
        return lat * 100 / 36;
    },

    // Convert CH y/x to WGS lng
    CHtoWGSlng: function (y, x) {
        // Converts military to civil and       to unit = 1000km
        // Auxiliary values (% Bern)
        const y_aux = (y - 600000)/1000000;
        const x_aux = (x - 200000)/1000000;

        // Process lng
        const lng = 2.6779094 +
              4.728982 * y_aux +
              0.791484 * y_aux * x_aux +
              0.1306       * y_aux * Math.pow(x_aux, 2) -
              0.0436       * Math.pow(y_aux, 3);

        // Unit 10000" to 1 " and converts seconds to degrees (dec)
        return lng * 100 / 36;
    },

    // Convert angle in decimal degrees to sexagesimal seconds
    DECtoSEX: function (angle) {
        // Extract DMS
        const deg = parseInt(angle);
        const min = parseInt((angle-deg)*60);
        const sec = (((angle-deg)*60)-min)*60;     

        // Result sexagesimal seconds
        return sec + min*60.0 + deg*3600.0;
    }
}
