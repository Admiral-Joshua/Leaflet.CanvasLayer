L.CanvasLayer = L.Layer.extend({
    options: {
        projection: L.CRS.EPSG3857
    },

    initialize: function(options) {
        L.setOptions(this, options);

        // PERFORM OTHER INITIALISATION STEPS.
        // Set-up array to hold references to leaflet markers to be rendered on the map.
        /*this._lats = new Proxy([], {
            get(target, prop) {
                if (!isNaN(prop)) {
                    prop = parseInt(prop, 10);
                    if (prop < 0) {
                        prop += 200;
                    }
                }
            }
        });*/
        this._lats = [];
        this._lngs = [];
    },

    onAdd: function(map) {
        // Create a reference to the map so we can work with it later on.
        this._map = map;


        this._container = L.DomUtil.create('div', 'leaflet-image-layer');
        this._canvas = L.DomUtil.create('canvas', '');

        this._size = map.getSize();

        this._container.style.width = this._size.x + 'px';
        this._container.style.height = this._size.y + 'px';

        this._canvas.width = this._size.x;
        this._canvas.height = this._size.y;

        this._ctx = this._canvas.getContext('2d');

        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-animated');
        } else {
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-hide');
        }

        this._container.appendChild(this._canvas);


        /*L.extend(this._canvas, {
            onselectstart: L.Util.falseFn,
            onmousemove: L.Util.falseFn,
            onload: L.bind(this._onCanvasLoad, this)
        });*/

        map._panes.overlayPane.appendChild(this._container);

        map.on('moveend', this.__render, this);

        this.__render();
    },

    // ON REMOVE - REMOVE DOM ELEMENTS AND CLEAN-UP.
    onRemove: function(map) {
        map.off('moveend', this.__render, this);
    },

    _roundPoint(point) {
        let pt = {
            lat: point.lat,
            lng: point.lng
        };

        // bring to positive.
        pt.lat += 90;
        pt.lng += 180;

        // round to useful index value. (keeps up to 5/6 decimal places)
        pt.lat = Math.floor(pt.lat * 10000);
        pt.lng = Math.floor(pt.lng * 10000);
        // deprecated: round to nearest half.
        //let val = Math.ceil(num * 2) / 2;

        return pt;
    },

    __render: function() {
        //map.getBounds()

        var top = map.containerPointToLayerPoint([0, 0]);

        L.DomUtil.setPosition(this._container, top);

        let bounds = this._map.getBounds();
        let topLeft = this._roundPoint(bounds.getNorthWest());
        let bottomRight = this._roundPoint(bounds.getSouthEast());

        // Round 'em
        let minX = topLeft.lng;
        let minY = bottomRight.lat;
        let maxX = bottomRight.lng;
        let maxY = topLeft.lat;


        // Now pull values out.
        let matchedLats = this._lats.splice(Math.max(0, minY), Math.min(maxY, this._lats.length));
        let matchedLngs = this._lngs.splice(Math.max(minX, 0), Math.min(maxX, this._lngs.length));

        //let matches = matchedLats.filter(value => matchedLngs.includes(value));
        let matches = matchedLats.flat().concat(matchedLngs.flat());

        // get context
        let ctx = this._ctx;
        // clear the canvas ready for view.
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00ccff";


        // Now that we have our filtered down array of markers. Proceed to render them.
        ctx.beginPath();
        matches.forEach((marker) => {
            if (marker) {
                // Get x and y position
                //let pt = this.options.projection.latLngToPoint(marker.getLatLng(), this._map.getZoom());
                let pt = this._map.project(marker.getLatLng());


                //ctx.translate(pt.x, pt.y);
                //ctx.rotate((Math.PI / 180) * marker.options.data.course);
                //ctx.translate(0, 0);
                //ctx.arc(pt.x, pt.y, 50, 0, 2 * Math.PI);
                ctx.strokeRect(pt.x, pt.y, 2, 2);

                //console.log(pt.x, pt.y, this._size.x, this._size.y);
            }
        });
        ctx.closePath();
        console.log(`Rendered ${matches.length} markers.`);

    },

    addMarker: function(marker) {
        let pos = marker.getLatLng();

        pos = this._roundPoint(pos);

        let lat = pos.lat;
        let lng = pos.lng;

        // Check whether there are already markers defined at this position.
        if (!this._lats[lat]) {
            // If not, define first.
            this._lats[lat] = [];
        }
        if (!this._lngs[lng]) {
            this._lngs[lng] = [];
        }

        // Add marker to collections.
        this._lats[lat].push(marker);
        this._lngs[lng].push(marker);
    },
    addMarkers: function(markers) {
        markers.forEach((marker) => {
            this.addMarker(marker);
        });
    },
    removeMarker: (marker) => {
        let pos = marker.getLatLng();
    }
});

L.canvasLayer = function(options) {
    return new L.CanvasLayer(options);
};