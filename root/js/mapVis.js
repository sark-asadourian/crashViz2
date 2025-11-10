class MapVis {
    constructor(parentElement, crashData, geoData) {
        let vis = this;
        vis.parentElement = parentElement;
        vis.crashData = crashData || [];
        vis.geoData = geoData;
        vis.selectedYear = 2006;
        vis.activeFilters = ['Fatal', 'Major', 'Minor', 'Minimal'];

        console.log('MapVis constructor called with:', {
            crashDataLength: vis.crashData.length,
            hasGeoData: !!vis.geoData,
            parentElement: vis.parentElement
        });

        vis.severityColors = {
            'Fatal': '#e23725',
            'Major': '#ff7f00',
            'Minor': '#ffd700',
            'Minimal': '#6c757d'
        };

        vis.districtLabels = [
            { name: "East York", lat: 43.69, lng: -79.34 },
            { name: "North York", lat: 43.76, lng: -79.42 },
            { name: "Scarborough", lat: 43.77, lng: -79.26 },
            { name: "Etobicoke", lat: 43.70, lng: -79.55 }
        ];

        try {
            vis.precomputeBounds();
            vis.initVis();
        } catch (error) {
            console.error('Error in MapVis initialization:', error);
            vis.showError(error.message);
        }
    }

    showError(message) {
        let vis = this;
        const container = d3.select("#" + vis.parentElement);
        container.html(`
            <div style="padding: 40px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                <h3>Map Loading Error</h3>
                <p>${message}</p>
                <button onclick="showRegularMap()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
                    Reload Map
                </button>
            </div>
        `);
    }

    precomputeBounds() {
        let vis = this;

        if (!vis.crashData || vis.crashData.length === 0) {
            console.warn('No crash data available, using default bounds');
            vis.latMin = 43.58;
            vis.latMax = 43.85;
            vis.lngMin = -79.65;
            vis.lngMax = -79.11;
            return;
        }

        let lats = vis.crashData.map(d => d.LATITUDE).filter(lat => !isNaN(lat));
        let lngs = vis.crashData.map(d => d.LONGITUDE).filter(lng => !isNaN(lng));

        if (lats.length > 0 && lngs.length > 0) {
            vis.latMin = d3.min(lats);
            vis.latMax = d3.max(lats);
            vis.lngMin = d3.min(lngs);
            vis.lngMax = d3.max(lngs);

            let latPadding = (vis.latMax - vis.latMin) * 0.1;
            let lngPadding = (vis.lngMax - vis.lngMin) * 0.1;
            vis.latMin -= latPadding;
            vis.latMax += latPadding;
            vis.lngMin -= lngPadding;
            vis.lngMax += lngPadding;
        } else {
            vis.latMin = 43.58;
            vis.latMax = 43.85;
            vis.lngMin = -79.65;
            vis.lngMax = -79.11;
        }
    }

    initVis() {
        let vis = this;

        console.log('Initializing MapVis visualization...');

        vis.margin = {top: 0, right: 0, bottom: 0, left: 0};
        vis.width = 829 - vis.margin.left - vis.margin.right;
        vis.height = 609.88 - vis.margin.top - vis.margin.bottom;

        // Clear any existing content
        const parent = d3.select("#" + vis.parentElement);
        parent.html('');

        vis.svg = parent
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("viewBox", [0, 0, vis.width + vis.margin.left + vis.margin.right, vis.height + vis.margin.top + vis.margin.bottom])
            .style("cursor", "grab");

        vis.mainGroup = vis.svg.append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.zoomableGroup = vis.mainGroup.append("g")
            .attr("class", "zoomable-group");

        vis.xScale = d3.scaleLinear()
            .domain([vis.lngMin, vis.lngMax])
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .domain([vis.latMin, vis.latMax])
            .range([vis.height, 0]);

        vis.mapBackground = vis.zoomableGroup.append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("fill", "#f8f9fa")
            .attr("rx", 12)
            .attr("stroke", "#dee2e6")
            .attr("stroke-width", 1);

        if (vis.geoData && vis.geoData.features) {
            try {
                let centerLng = (vis.lngMin + vis.lngMax) / 2;
                let centerLat = (vis.latMin + vis.latMax) / 2;

                vis.projection = d3.geoMercator()
                    .center([centerLng, centerLat])
                    .scale(vis.width * 100)
                    .translate([vis.width / 2, vis.height / 2]);

                vis.path = d3.geoPath().projection(vis.projection);

                vis.roads = vis.zoomableGroup.append("path")
                    .attr("class", "roads")
                    .attr("d", vis.path(vis.geoData))
                    .attr("fill", "none")
                    .attr("stroke", "#6c757d")
                    .attr("stroke-width", 0.5)
                    .attr("opacity", 0.7);
            } catch (error) {
                console.warn('Error drawing roads:', error);
            }
        }

        vis.addDistrictLabels();

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "map-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.95)")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("padding", "8px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        vis.setupZoom();

        vis.addZoomControls();

        vis.wrangleData();

        console.log('MapVis initialization completed successfully');
    }

    setupZoom() {
        let vis = this;

        vis.zoom = d3.zoom()
            .scaleExtent([0.5, 8])
            .translateExtent([[0, 0], [vis.width, vis.height]])
            .on("zoom", (event) => {
                vis.handleZoom(event);
            });

        vis.svg.call(vis.zoom);

        vis.svg.on("dblclick.zoom", null);
        vis.svg.on("dblclick", (event) => {
            event.preventDefault();
            const point = d3.pointer(event, vis.mainGroup.node());
            const scale = vis.currentTransform.k * 2;
            const translate = [
                vis.width / 2 - scale * point[0],
                vis.height / 2 - scale * point[1]
            ];

            vis.svg.transition()
                .duration(250)
                .call(vis.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        });
    }

    handleZoom(event) {
        let vis = this;
        vis.currentTransform = event.transform;

        vis.zoomableGroup.attr("transform", event.transform);

        const scaleFactor = 1 / event.transform.k;
        vis.zoomableGroup.selectAll(".crash-point")
            .attr("r", d => Math.max(2, d.size * scaleFactor));
    }

    addZoomControls() {
        let vis = this;

        vis.zoomControls = d3.select("#" + vis.parentElement)
            .append("div")
            .attr("class", "zoom-controls")
            .style("position", "absolute")
            .style("bottom", "20px")
            .style("left", "20px")
            .style("z-index", "1000")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "5px");

        vis.zoomControls.append("button")
            .attr("class", "zoom-btn zoom-in")
            .html("+")
            .style("width", "40px")
            .style("height", "40px")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
            .on("click", () => {
                vis.zoomIn();
            });

        vis.zoomControls.append("button")
            .attr("class", "zoom-btn zoom-out")
            .html("−")
            .style("width", "40px")
            .style("height", "40px")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
            .on("click", () => {
                vis.zoomOut();
            });

        vis.zoomControls.append("button")
            .attr("class", "zoom-btn zoom-reset")
            .html("⟲")
            .style("width", "40px")
            .style("height", "40px")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("font-size", "16px")
            .style("cursor", "pointer")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
            .on("click", () => {
                vis.resetZoom();
            });
    }

    zoomIn() {
        let vis = this;
        vis.svg.transition()
            .duration(250)
            .call(vis.zoom.scaleBy, 1.5);
    }

    zoomOut() {
        let vis = this;
        vis.svg.transition()
            .duration(250)
            .call(vis.zoom.scaleBy, 0.75);
    }

    resetZoom() {
        let vis = this;
        vis.svg.transition()
            .duration(250)
            .call(vis.zoom.transform, d3.zoomIdentity);
    }

    addDistrictLabels() {
        let vis = this;

        vis.districtLabelsGroup = vis.zoomableGroup.append("g")
            .attr("class", "district-labels");

        vis.districtLabels.forEach(district => {
            if (district.lat >= vis.latMin && district.lat <= vis.latMax &&
                district.lng >= vis.lngMin && district.lng <= vis.lngMax) {

                const x = vis.xScale(district.lng);
                const y = vis.yScale(district.lat);

                vis.districtLabelsGroup.append("text")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .style("fill", "#001f3f")
                    .style("text-shadow", "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white")
                    .style("pointer-events", "none")
                    .style("user-select", "none")
                    .text(district.name);
            }
        });

        const torontoCenterX = vis.xScale((vis.lngMin + vis.lngMax) / 2);
        const torontoCenterY = vis.yScale((vis.latMin + vis.latMax) / 2) - 20;

        vis.districtLabelsGroup.append("text")
            .attr("x", torontoCenterX)
            .attr("y", torontoCenterY)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "#001f3f")
            .style("text-shadow", "2px 2px 4px white, -2px -2px 4px white, 2px -2px 4px white, -2px 2px 4px white")
            .style("pointer-events", "none")
            .style("user-select", "none")
            .text("TORONTO");
    }

    wrangleData() {
        let vis = this;

        if (!vis.crashData || vis.crashData.length === 0) {
            console.warn('No crash data available for wrangling');
            vis.zoomableGroup.selectAll(".crash-point").remove();
            return;
        }

        vis.displayData = vis.crashData.filter(d =>
            d.Year === vis.selectedYear &&
            vis.activeFilters.includes(d.Severity)
        );

        console.log(`Filtered ${vis.displayData.length} records for year ${vis.selectedYear}`);

        if (vis.displayData.length === 0) {
            vis.zoomableGroup.selectAll(".crash-point").remove();
            return;
        }

        vis.clusteredData = vis.createOptimizedClusters(vis.displayData);
        vis.updateVis();
    }

    createOptimizedClusters(data) {
        let vis = this;
        let clusters = [];
        let clusterDistance = 0.002;

        const sortedData = [...data].sort((a, b) => a.LATITUDE - b.LATITUDE);

        for (let point of sortedData) {
            let foundCluster = false;
            let lat = point.LATITUDE;
            let lng = point.LONGITUDE;

            const recentClusters = clusters.slice(-10);

            for (let cluster of recentClusters) {
                let distance = Math.sqrt(
                    Math.pow(lat - cluster.centerLat, 2) +
                    Math.pow(lng - cluster.centerLng, 2)
                );

                if (distance < clusterDistance) {
                    cluster.points.push(point);
                    cluster.centerLat = (cluster.centerLat * (cluster.points.length - 1) + lat) / cluster.points.length;
                    cluster.centerLng = (cluster.centerLng * (cluster.points.length - 1) + lng) / cluster.points.length;
                    foundCluster = true;
                    break;
                }
            }

            if (!foundCluster) {
                clusters.push({
                    centerLat: lat,
                    centerLng: lng,
                    points: [point],
                    count: 1
                });
            }
        }

        return clusters.map(cluster => {
            let severityCounts = { 'Fatal': 0, 'Major': 0, 'Minor': 0, 'Minimal': 0 };

            cluster.points.forEach(point => {
                severityCounts[point.Severity]++;
            });

            let dominantSeverity = Object.keys(severityCounts).reduce((a, b) =>
                severityCounts[a] > severityCounts[b] ? a : b
            );

            let size = Math.min(20, Math.max(3, 3 + Math.sqrt(cluster.points.length) * 2));

            return {
                x: vis.xScale(cluster.centerLng),
                y: vis.yScale(cluster.centerLat),
                lat: cluster.centerLat,
                lng: cluster.centerLng,
                severity: dominantSeverity,
                size: size,
                count: cluster.points.length,
                severityCounts: severityCounts
            };
        });
    }

    updateVis() {
        let vis = this;

        // Select points from the zoomable group
        vis.crashPoints = vis.zoomableGroup.selectAll(".crash-point")
            .data(vis.clusteredData, d => d.x + '_' + d.y);

        vis.crashPoints.exit()
            .transition()
            .duration(300)
            .attr("r", 0)
            .attr("opacity", 0)
            .remove();

        vis.enterPoints = vis.crashPoints.enter()
            .append("circle")
            .attr("class", "crash-point")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 0)
            .attr("opacity", 0)
            .attr("fill", d => vis.severityColors[d.severity])
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.8)
            .on("mouseover", function(event, d) {
                vis.showTooltip(event, d);
            })
            .on("mouseout", function() {
                vis.hideTooltip();
            });

        vis.mergePoints = vis.enterPoints.merge(vis.crashPoints);

        vis.mergePoints
            .transition()
            .duration(300)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => {
                const scaleFactor = vis.currentTransform ? 1 / vis.currentTransform.k : 1;
                return Math.max(2, d.size * scaleFactor);
            })
            .attr("opacity", 0.85)
            .attr("fill", d => vis.severityColors[d.severity]);

        vis.zoomableGroup.select(".district-labels").raise();
    }

    showTooltip(event, d) {
        let vis = this;

        let severityBreakdown = Object.entries(d.severityCounts)
            .filter(([severity, count]) => count > 0)
            .map(([severity, count]) => `${severity}: ${count}`)
            .join('<br>');

        vis.tooltip
            .style("opacity", 1)
            .html(`
                <strong>Accident Cluster</strong><br>
                Total Accidents: ${d.count}<br>
                Dominant Severity: ${d.severity}<br>
                <br>
                <strong>Severity Breakdown:</strong><br>
                ${severityBreakdown}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    hideTooltip() {
        let vis = this;
        vis.tooltip.style("opacity", 0);
    }

    setYear(year) {
        let vis = this;
        vis.selectedYear = year;
        vis.wrangleData();
    }

    setFilters(filters) {
        let vis = this;
        vis.activeFilters = filters;
        vis.wrangleData();
    }

    ensureLabelsVisible() {
        let vis = this;
        vis.zoomableGroup.select(".district-labels")
            .style("display", "block")
            .raise();
    }
}