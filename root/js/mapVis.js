/* * * * * * * * * * * * * * *
*          MapVis             *
* * * * * * * * * * * * * * */

class MapVis {

    constructor(parentElement, crashData, geoData) {
        let vis = this;
        vis.parentElement = parentElement;
        vis.crashData = crashData;
        vis.geoData = geoData;
        vis.selectedYear = 2003;
        vis.activeFilters = ['Fatal', 'Major', 'Minor', 'Minimal'];

        // Severity colors
        vis.severityColors = {
            'Fatal': 'rgba(226,55,55,0.76)',
            'Major': 'rgba(237,119,55,0.8)',
            'Minor': 'rgba(237,225,55,0.8)',
            'Minimal': 'rgba(128,128,128,0.8)'
        };

        vis.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 0, right: 0, bottom: 0, left: 0};
        vis.width = 829 - vis.margin.left - vis.margin.right;
        vis.height = 609.88 - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Calculate bounds from data or use default Toronto bounds
        if (vis.crashData && vis.crashData.length > 0) {
            let lats = vis.crashData.map(d => +d.LATITUDE).filter(d => !isNaN(d) && d > 0);
            let lngs = vis.crashData.map(d => +d.LONGITUDE).filter(d => !isNaN(d) && d < 0);
            if (lats.length > 0 && lngs.length > 0) {
                vis.latMin = d3.min(lats);
                vis.latMax = d3.max(lats);
                vis.lngMin = d3.min(lngs);
                vis.lngMax = d3.max(lngs);
                // Add padding
                let latPadding = (vis.latMax - vis.latMin) * 0.1;
                let lngPadding = (vis.lngMax - vis.lngMin) * 0.1;
                vis.latMin -= latPadding;
                vis.latMax += latPadding;
                vis.lngMin -= lngPadding;
                vis.lngMax += lngPadding;
            } else {
                // Default Toronto bounds
                vis.latMin = 43.58;
                vis.latMax = 43.85;
                vis.lngMin = -79.65;
                vis.lngMax = -79.11;
            }
        } else {
            // Default Toronto bounds
            vis.latMin = 43.58;
            vis.latMax = 43.85;
            vis.lngMin = -79.65;
            vis.lngMax = -79.11;
        }

        // Set up coordinate scales
        vis.xScale = d3.scaleLinear()
            .domain([vis.lngMin, vis.lngMax])
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .domain([vis.latMin, vis.latMax])
            .range([vis.height, 0]);

        // Store scales for use in wrangleData
        vis.latScale = vis.yScale;
        vis.lngScale = vis.xScale;

        // Draw map background (grayscale Toronto map)
        vis.mapBackground = vis.svg.append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("fill", "#f5f5f5")
            .attr("rx", 12);

        // Draw GeoJSON if available
        if (vis.geoData && vis.geoData.features) {
            // Create projection centered on Toronto
            let centerLng = (vis.lngMin + vis.lngMax) / 2;
            let centerLat = (vis.latMin + vis.latMax) / 2;
            
            vis.projection = d3.geoMercator()
                .center([centerLng, centerLat])
                .scale(vis.width * 15)
                .translate([vis.width / 2, vis.height / 2]);

            vis.path = d3.geoPath()
                .projection(vis.projection);

            // Draw roads
            vis.roads = vis.svg.selectAll(".road")
                .data(vis.geoData.features)
                .enter()
                .append("path")
                .attr("class", "road")
                .attr("d", vis.path)
                .attr("fill", "none")
                .attr("stroke", "#d0d0d0")
                .attr("stroke-width", 0.3)
                .attr("opacity", 0.6);
        }

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Filter data by year and severity
        vis.displayData = vis.crashData.filter(d => {
            // Try Year column first, then Year of collision
            let year = +d.Year || +d['Year of collision'] || 0;
            let injury = (d.Injury || '').trim();
            let classification = (d['Accident Classification'] || '').trim();
            
            // Map injury/classification to severity
            let severity = 'Minimal';
            if (injury === 'Fatal' || classification === 'Fatal') {
                severity = 'Fatal';
            } else if (injury === 'Major' || classification.includes('Major')) {
                severity = 'Major';
            } else if (injury === 'Minor' || classification.includes('Minor')) {
                severity = 'Minor';
            } else if (injury === 'Minimal') {
                severity = 'Minimal';
            } else if (injury === 'None' || !injury) {
                severity = 'Minimal';
            }

            return year === vis.selectedYear && 
                   vis.activeFilters.includes(severity) &&
                   d.LATITUDE && 
                   d.LONGITUDE &&
                   !isNaN(+d.LATITUDE) && 
                   !isNaN(+d.LONGITUDE);
        }).map(d => {
            let injury = (d.Injury || '').trim();
            let classification = (d['Accident Classification'] || '').trim();
            
            // Map to severity
            let severity = 'Minimal';
            if (injury === 'Fatal' || classification === 'Fatal') {
                severity = 'Fatal';
            } else if (injury === 'Major' || classification.includes('Major')) {
                severity = 'Major';
            } else if (injury === 'Minor' || classification.includes('Minor')) {
                severity = 'Minor';
            } else if (injury === 'Minimal') {
                severity = 'Minimal';
            } else if (injury === 'None' || !injury) {
                severity = 'Minimal';
            }

            return {
                lat: +d.LATITUDE,
                lng: +d.LONGITUDE,
                severity: severity,
                x: vis.xScale(+d.LONGITUDE),
                y: vis.yScale(+d.LATITUDE)
            };
        });

        // Group by location to cluster overlapping points (within 5px)
        let clusterMap = {};
        vis.displayData.forEach(d => {
            // Round to nearest 5 pixels for clustering
            let roundedX = Math.round(d.x / 5) * 5;
            let roundedY = Math.round(d.y / 5) * 5;
            let key = roundedX + '_' + roundedY;
            if (!clusterMap[key]) {
                clusterMap[key] = [];
            }
            clusterMap[key].push(d);
        });

        // Create cluster data with size
        vis.clusteredData = Object.values(clusterMap).map(cluster => {
            let basePoint = cluster[0];
            let severityCounts = {
                'Fatal': 0,
                'Major': 0,
                'Minor': 0,
                'Minimal': 0
            };
            cluster.forEach(d => severityCounts[d.severity]++);
            
            // Determine dominant severity
            let dominantSeverity = Object.keys(severityCounts).reduce((a, b) => 
                severityCounts[a] > severityCounts[b] ? a : b
            );

            // Size based on cluster size
            let size = Math.min(61, Math.max(26, 26 + cluster.length * 5));

            return {
                x: basePoint.x,
                y: basePoint.y,
                lat: basePoint.lat,
                lng: basePoint.lng,
                severity: dominantSeverity,
                size: size,
                count: cluster.length
            };
        });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // D3 update pattern
        vis.crashPoints = vis.svg.selectAll(".crash-point")
            .data(vis.clusteredData, d => d.x + '_' + d.y);

        // Exit
        vis.crashPoints.exit()
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .attr("r", 0)
            .remove();

        // Enter
        vis.enter = vis.crashPoints.enter()
            .append("circle")
            .attr("class", "crash-point")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 0)
            .attr("opacity", 0)
            .attr("fill", d => vis.severityColors[d.severity])
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

        // Merge
        vis.merge = vis.enter.merge(vis.crashPoints);

        vis.merge
            .transition()
            .duration(300)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.size / 2)
            .attr("opacity", 0.8)
            .attr("fill", d => vis.severityColors[d.severity]);
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
}

