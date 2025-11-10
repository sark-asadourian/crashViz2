class ActionHotspotVis {

    constructor(parentElement, crashData, geoData, solutionsData = null) {
        let vis = this;
        vis.parentElement = parentElement;
        vis.crashData = crashData;
        vis.geoData = geoData;
        vis.selectedActionType = 'All'; // 'All', 'Driver', 'Pedestrian', 'Cyclist'
        vis.selectedAction = 'All';
        vis.selectedYear = 2006;
        vis.displayMode = 'cluster'; // 'individual' or 'cluster'
        vis.zoomHandler = null;

        // Define colors for each action type
        vis.actionTypeColors = {
            'Driver': '#98cef4',
            'Pedestrian': '#f67171',
            'Cyclist': '#1eff5e'
        };

        vis.isEmptyMapMode = false;

        vis.improvementSuggestions = new ImprovementSuggestions(crashData, solutionsData);
        vis.showImprovements = false;

        vis.filteredData = [];

        vis.districtLabels = [
            { name: "East York", lat: 43.69, lng: -79.34 },
            { name: "North York", lat: 43.76, lng: -79.42 },
            { name: "Scarborough", lat: 43.77, lng: -79.26 },
            { name: "Etobicoke", lat: 43.70, lng: -79.55 }
        ];

        vis.precomputeData();

        vis.initVis();
        vis.createToggleButton();

        vis.wrangleData();
    }

    precomputeData() {
        let vis = this;

        let driverActions = {};
        let pedestrianActions = {};
        let cyclistActions = {};
        let allActions = {};

        vis.precomputedData = vis.crashData.map(d => {
            // convert latitude and longitude to numbers
            const lat = parseFloat(d.LATITUDE);
            const lng = parseFloat(d.LONGITUDE);
            const year = +d.Year || +d['Year of collision'] || 0;

            const driverAction = (d['Apparent Driver Action'] || '').trim();
            const pedestrianAction = (d['Pedestrian Action'] || '').trim();
            const cyclistAction = (d['Cyclist Action'] || '').trim();

            // Check if coordinates are valid numbers
            const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat > 0 && lng < 0;

            // Precompute action type for faster access
            let actionType = 'Driver';
            if (pedestrianAction && pedestrianAction !== '' && pedestrianAction !== 'Unknown') {
                actionType = 'Pedestrian';
            } else if (cyclistAction && cyclistAction !== '' && cyclistAction !== 'Unknown') {
                actionType = 'Cyclist';
            }

            // Count actions for top actions extraction
            if (driverAction && driverAction !== '' && driverAction !== 'Unknown') {
                driverActions[driverAction] = (driverActions[driverAction] || 0) + 1;
                allActions[`Driver: ${driverAction}`] = (allActions[`Driver: ${driverAction}`] || 0) + 1;
            }
            if (pedestrianAction && pedestrianAction !== '' && pedestrianAction !== 'Unknown') {
                pedestrianActions[pedestrianAction] = (pedestrianActions[pedestrianAction] || 0) + 1;
                allActions[`Pedestrian: ${pedestrianAction}`] = (allActions[`Pedestrian: ${pedestrianAction}`] || 0) + 1;
            }
            if (cyclistAction && cyclistAction !== '' && cyclistAction !== 'Unknown') {
                cyclistActions[cyclistAction] = (cyclistActions[cyclistAction] || 0) + 1;
                allActions[`Cyclist: ${cyclistAction}`] = (allActions[`Cyclist: ${cyclistAction}`] || 0) + 1;
            }

            return {
                originalData: d,
                lat: lat,
                lng: lng,
                year: year,
                driverAction: driverAction,
                pedestrianAction: pedestrianAction,
                cyclistAction: cyclistAction,
                actionType: actionType,
                color: vis.actionTypeColors[actionType],
                hasValidCoords: hasValidCoords,
                hasDriverAction: driverAction && driverAction !== '' && driverAction !== 'Unknown',
                hasPedestrianAction: pedestrianAction && pedestrianAction !== '' && pedestrianAction !== 'Unknown',
                hasCyclistAction: cyclistAction && cyclistAction !== '' && cyclistAction !== 'Unknown'
            };
        });

        // Get top 5 actions for each category
        vis.driverActions = Object.entries(driverActions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([action]) => action);

        vis.pedestrianActions = Object.entries(pedestrianActions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([action]) => action);

        vis.cyclistActions = Object.entries(cyclistActions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([action]) => action);

        vis.allActions = [
            ...vis.driverActions.map(action => `Driver: ${action}`),
            ...vis.pedestrianActions.map(action => `Pedestrian: ${action}`),
            ...vis.cyclistActions.map(action => `Cyclist: ${action}`)
        ];

        console.log('Top Driver Actions:', vis.driverActions);
        console.log('Top Pedestrian Actions:', vis.pedestrianActions);
        console.log('Top Cyclist Actions:', vis.cyclistActions);
    }

    initVis() {
        let vis = this;

        console.log('Initializing ActionHotspotVis');

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = 900 - vis.margin.left - vis.margin.right;
        vis.height = 700 - vis.margin.top - vis.margin.bottom;

        // Clear any existing content
        const parent = d3.select("#" + vis.parentElement);
        console.log('Parent element before clear:', parent.node());
        parent.html('');

        vis.createControls();

        vis.svg = parent
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("viewBox", [0, 0, vis.width + vis.margin.left + vis.margin.right, vis.height + vis.margin.top + vis.margin.bottom])
            .style("cursor", "grab");

        vis.mainGroup = vis.svg.append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.zoomableLayer = vis.mainGroup.append("g")
            .attr("class", "zoomable-layer");

        console.log('SVG created:', vis.svg.node());

        let validCoords = vis.precomputedData.filter(d => d.hasValidCoords);
        if (validCoords.length > 0) {
            vis.latMin = d3.min(validCoords, d => d.lat);
            vis.latMax = d3.max(validCoords, d => d.lat);
            vis.lngMin = d3.min(validCoords, d => d.lng);
            vis.lngMax = d3.max(validCoords, d => d.lng);

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

        // Set up coordinate scales
        vis.xScale = d3.scaleLinear()
            .domain([vis.lngMin, vis.lngMax])
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .domain([vis.latMin, vis.latMax])
            .range([vis.height, 0]);

        // Draw map background
        vis.mapBackground = vis.zoomableLayer.append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("fill", "#f8f9fa")
            .attr("rx", 12)
            .attr("stroke", "#ddd")
            .attr("stroke-width", 1);

        if (vis.geoData && vis.geoData.features) {
            let centerLng = (vis.lngMin + vis.lngMax) / 2;
            let centerLat = (vis.latMin + vis.latMax) / 2;

            vis.projection = d3.geoMercator()
                .center([centerLng, centerLat])
                .scale(vis.width * 100)
                .translate([vis.width / 2, vis.height / 2]);

            vis.path = d3.geoPath().projection(vis.projection);

            vis.roads = vis.zoomableLayer.append("path")
                .attr("class", "road")
                .attr("d", vis.path(vis.geoData))
                .attr("fill", "none")
                .attr("stroke", "#6c757d")
                .attr("stroke-width", 0.5)
                .attr("opacity", 0.7);
        }

        vis.addDistrictLabels();

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "action-hotspot-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.95)")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("padding", "8px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        vis.createYearDisplay();
        vis.createClickInstruction();
        vis.createToggleButton();

        vis.setupZoom();

        vis.addZoomControls();

        vis.wrangleData();
    }

    setupZoom() {
        let vis = this;

        vis.zoom = d3.zoom()
            .scaleExtent([0.5, 8]) // Min and max zoom levels
            .translateExtent([[0, 0], [vis.width, vis.height]])
            .on("zoom", (event) => {
                vis.handleZoom(event);
            });

        vis.svg.call(vis.zoom);

        vis.svg.on("dblclick.zoom", null);
        vis.svg.on("dblclick", (event) => {
            event.preventDefault();
            const point = d3.pointer(event, vis.mainGroup.node());
            const scale = vis.currentTransform ? vis.currentTransform.k * 2 : 2;
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

        vis.zoomableLayer.attr("transform", event.transform);

        const scaleFactor = 1 / event.transform.k;
        vis.zoomableLayer.selectAll(".action-cluster")
            .attr("r", d => Math.max(3, vis.sizeScale(d.count) * scaleFactor));

        vis.zoomableLayer.selectAll(".individual-point")
            .attr("r", d => Math.max(2, 5 * scaleFactor));
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

        vis.districtLabelsGroup = vis.zoomableLayer.append("g")
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
                    .style("fill", "#0800ff")
                    .style("text-shadow", "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white")
                    .style("pointer-events", "none")
                    .style("user-select", "none")
                    .attr("class", "district-label-text")
                    .text(district.name);
            }
        });

        const torontoCenterX = vis.xScale((vis.lngMin + vis.lngMax) / 2);
        const torontoCenterY = vis.yScale((vis.latMin + vis.latMax) / 2) - 20;

        vis.districtLabelsGroup.append("text")
            .attr("x", torontoCenterX)
            .attr("y", torontoCenterY - 8)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "#006fff")
            .style("text-shadow", "2px 2px 4px white, -2px -2px 4px white, 2px -2px 4px white, -2px 2px 4px white")
            .style("pointer-events", "none")
            .style("user-select", "none")
            .attr("class", "toronto-label-text")
            .text("TORONTO");
    }

    createToggleButton() {
        let vis = this;

        vis.toggleButton = d3.select("#" + vis.parentElement)
            .append("button")
            .attr("class", "toggle-empty-map-btn")
            .text("Show Empty Map")
            .style("position", "absolute")
            .style("top", "calc(20px + 180px)")
            .style("right", "20px")
            .style("z-index", "10")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("padding", "8px 16px")
            .style("cursor", "pointer")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
            .on("click", function () {
                vis.toggleEmptyMap();
            });
    }

    toggleEmptyMap() {
        let vis = this;

        if (vis.isEmptyMapMode) {
            vis.showActionHotspots();
        } else {
            vis.showEmptyMap();
        }
    }

    showEmptyMap() {
        let vis = this;

        // Remove all action clusters and individual points
        vis.svg.selectAll(".action-cluster, .individual-point")
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .attr("r", 0)
            .remove();

        // Hide controls but keep them positioned
        vis.controls.style("opacity", "0.7"); // Make semi-transparent instead of hiding

        // Update title
        vis.updateTitle("Empty Map View");

        // Update button text
        vis.toggleButton.text("Show Action Hotspots");

        // Update mode
        vis.isEmptyMapMode = true;
    }

    showActionHotspots() {
        let vis = this;

        // Show controls with full opacity
        vis.controls.style("opacity", "1");

        // Update title
        vis.updateTitle(`${vis.selectedActionType} Action Hotspots (${vis.selectedYear}): ${vis.selectedAction === 'All' ? 'All Actions' : vis.selectedAction}`);

        // Update button text
        vis.toggleButton.text("Show Empty Map");

        // Update mode
        vis.isEmptyMapMode = false;

        // Reload the data
        vis.wrangleData();
    }
    createControls() {
        let vis = this;

        console.log('Creating controls for parent element:', vis.parentElement);

        // Create controls container as a dialogue box above the map
        vis.controls = d3.select("#" + vis.parentElement)
            .append("div")
            .attr("class", "action-controls")
            .style("width", "100%")
            .style("background", "rgba(255, 255, 255, 0.98)")
            .style("border", "1px solid #ccc")
            .style("border-radius", "8px")
            .style("padding", "20px")
            .style("margin-bottom", "20px")
            .style("box-sizing", "border-box")
            .style("display", "grid")
            .style("grid-template-columns", "1fr 1fr 1fr")
            .style("gap", "20px")
            .style("align-items", "end")
            .style("box-shadow", "0 2px 10px rgba(0,0,0,0.1)");

        console.log('Controls container created:', vis.controls.node());

        // Display mode selector - Column 1
        const displayModeCol = vis.controls.append("div")
            .style("display", "flex")
            .style("flex-direction", "column");

        displayModeCol.append("label")
            .text("Display Mode")
            .style("font-weight", "bold")
            .style("margin-bottom", "8px")
            .style("font-size", "14px")
            .style("color", "#333");

        vis.displayModeSelect = displayModeCol.append("select")
            .style("width", "100%")
            .style("padding", "10px")
            .style("border", "1px solid #ddd")
            .style("border-radius", "6px")
            .style("font-size", "14px")
            .style("background", "#fff")
            .on("change", function () {
                vis.displayMode = this.value;
                vis.wrangleData();
            });

        vis.displayModeSelect.selectAll("option")
            .data(['cluster', 'individual'])
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d === 'cluster' ? 'Show Clusters' : 'Show Individual Accidents');

        // Action type selector - Column 2
        const actionTypeCol = vis.controls.append("div")
            .style("display", "flex")
            .style("flex-direction", "column");

        actionTypeCol.append("label")
            .text("Action Type")
            .style("font-weight", "bold")
            .style("margin-bottom", "8px")
            .style("font-size", "14px")
            .style("color", "#333");

        vis.actionTypeSelect = actionTypeCol.append("select")
            .style("width", "100%")
            .style("padding", "10px")
            .style("border", "1px solid #ddd")
            .style("border-radius", "6px")
            .style("font-size", "14px")
            .style("background", "#fff")
            .on("change", function () {
                vis.selectedActionType = this.value;
                vis.updateActionOptions();
                vis.wrangleData();
            });

        vis.actionTypeSelect.selectAll("option")
            .data(['All', 'Driver', 'Pedestrian', 'Cyclist'])
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d + " Actions");

        // Specific action selector
        const specificActionCol = vis.controls.append("div")
            .style("display", "flex")
            .style("flex-direction", "column");

        specificActionCol.append("label")
            .text("Specific Action")
            .style("font-weight", "bold")
            .style("margin-bottom", "8px")
            .style("font-size", "14px")
            .style("color", "#333");

        vis.actionSelect = specificActionCol.append("select")
            .style("width", "100%")
            .style("padding", "10px")
            .style("border", "1px solid #ddd")
            .style("border-radius", "6px")
            .style("font-size", "14px")
            .style("background", "#fff")
            .on("change", function () {
                vis.selectedAction = this.value;
                vis.wrangleData();
            });

        // Update action options based on type
        vis.updateActionOptions();

        // Add legend and improvements in a new row
        const bottomRow = vis.controls.append("div")
            .style("grid-column", "1 / -1")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("align-items", "center")
            .style("margin-top", "15px")
            .style("padding-top", "20px")
            .style("border-top", "2px solid #eee");

        console.log('Bottom row created:', bottomRow.node());

        // Legend on the left
        vis.createLegend(bottomRow);

        // Improvements toggle on the right
        vis.createImprovementsToggle(bottomRow);

        console.log('All controls created successfully');
    }

    updateActionOptions() {
        let vis = this;

        let actions = ['All'];

        if (vis.selectedActionType === 'All') {
            actions = ['All', ...vis.allActions];
        } else if (vis.selectedActionType === 'Driver') {
            actions = ['All', ...vis.driverActions];
        } else if (vis.selectedActionType === 'Pedestrian') {
            actions = ['All', ...vis.pedestrianActions];
        } else if (vis.selectedActionType === 'Cyclist') {
            actions = ['All', ...vis.cyclistActions];
        }

        vis.actionSelect.selectAll("option")
            .remove();

        vis.actionSelect.selectAll("option")
            .data(actions)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        vis.selectedAction = 'All';
    }

    createLegend(parentElement) {
        let vis = this;

        vis.legend = parentElement.append("div")
            .attr("class", "hotspot-legend")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "15px");

        vis.legend.append("div")
            .style("font-weight", "bold")
            .style("font-size", "14px")
            .text("Action Types:");

        let legendData = [
            {type: "Driver", color: vis.actionTypeColors.Driver},
            {type: "Pedestrian", color: vis.actionTypeColors.Pedestrian},
            {type: "Cyclist", color: vis.actionTypeColors.Cyclist}
        ];

        let legendItems = vis.legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("div")
            .attr("class", "legend-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "5px");

        legendItems.append("div")
            .style("width", "16px")
            .style("height", "16px")
            .style("background", d => d.color)
            .style("border", "1px solid #666")
            .style("border-radius", "3px");

        legendItems.append("div")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(d => d.type);
    }

    createImprovementsToggle(parentElement) {
        let vis = this;

        console.log('createImprovementsToggle called with parentElement:', parentElement);
        console.log('parentElement node:', parentElement.node());

        if (!parentElement || !parentElement.node()) {
            console.error('Invalid parentElement passed to createImprovementsToggle');
            return;
        }

        vis.improvementsToggle = parentElement.append("div")
            .attr("class", "improvements-toggle")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "10px");

        vis.improvementsToggle.append("label")
            .text("Show Improvement Suggestions")
            .style("font-weight", "bold")
            .style("font-size", "14px")
            .style("margin-right", "10px");

        vis.improvementsButton = vis.improvementsToggle.append("button")
            .text("Show Suggestions")
            .style("padding", "8px 16px")
            .style("background", "#4CAF50")
            .style("color", "white")
            .style("border", "none")
            .style("border-radius", "4px")
            .style("cursor", "pointer")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .on("click", function() {
                vis.toggleImprovementSuggestions();
            });

        // Create improvements panel - position on the map
        vis.improvementsPanel = d3.select("#" + vis.parentElement)
            .append("div")
            .attr("class", "improvements-panel")
            .style("position", "absolute")
            .style("top", "calc(20px + 200px)")
            .style("left", "20px")
            .style("background", "rgba(255, 255, 255, 0.98)")
            .style("border", "2px solid #4CAF50")
            .style("border-radius", "8px")
            .style("padding", "15px")
            .style("max-width", "350px")
            .style("max-height", "400px")
            .style("overflow-y", "auto")
            .style("z-index", "10")
            .style("display", "none")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)");

        console.log('Improvements toggle created successfully');
    }
    toggleImprovementSuggestions() {
        let vis = this;

        vis.showImprovements = !vis.showImprovements;

        if (vis.showImprovements) {
            console.log('=== GENERATING IMPROVEMENT SUGGESTIONS ===');
            console.log('Filtered data count:', vis.filteredData.length);
            console.log('Current action type:', vis.selectedActionType);
            console.log('Current specific action:', vis.selectedAction);
            console.log('Solutions data available:', vis.improvementSuggestions.solutionsData.length);

            // Analyze data and show suggestions
            const suggestions = vis.improvementSuggestions.analyzeData(vis.filteredData);

            vis.displayImprovementSuggestions(suggestions);
            vis.improvementsButton.text("Hide Suggestions");
            vis.improvementsPanel.style("display", "block");
        } else {
            vis.improvementsButton.text("Show Suggestions");
            vis.improvementsPanel.style("display", "none");
        }
    }

    displayImprovementSuggestions(suggestions) {
        let vis = this;

        // Clear previous content
        vis.improvementsPanel.html("");

        // Add header
        vis.improvementsPanel.append("h4")
            .text("Safety Improvement Suggestions")
            .style("margin", "0 0 15px 0")
            .style("color", "#333")
            .style("font-size", "16px");

        if (suggestions.length === 0) {
            vis.improvementsPanel.append("div")
                .text("No specific improvement suggestions based on current filters")
                .style("color", "#666")
                .style("font-style", "italic")
                .style("text-align", "center")
                .style("padding", "20px");
            return;
        }

        // Create suggestion cards
        const suggestionCards = vis.improvementsPanel.selectAll(".suggestion-card")
            .data(suggestions)
            .enter()
            .append("div")
            .attr("class", "suggestion-card")
            .style("background", "#f8f9fa")
            .style("border", "1px solid #e0e0e0")
            .style("border-radius", "6px")
            .style("padding", "12px")
            .style("margin-bottom", "10px")
            .style("cursor", "pointer")
            .on("mouseover", function() {
                d3.select(this).style("border-color", "#4CAF50");
            })
            .on("mouseout", function() {
                d3.select(this).style("border-color", "#e0e0e0");
            })
            .on("click", function(event, d) {
                vis.showSuggestionDetails(d);
            });

        suggestionCards.each(function(d) {
            const card = d3.select(this);

            // Header with icon and priority
            const header = card.append("div")
                .style("display", "flex")
                .style("justify-content", "space-between")
                .style("align-items", "center")
                .style("margin-bottom", "8px");

            header.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .html(`
                    <span style="font-size: 20px; margin-right: 8px;">${d.icon}</span>
                    <div>
                        <div style="font-weight: bold; font-size: 13px;">${d.title}</div>
                        <div style="font-size: 11px; color: #666;">${d.improvementType}</div>
                    </div>
                `);

            // Priority badge
            const priorityColor = d.priorityLevel === 'High' ? '#e23725' :
                d.priorityLevel === 'Medium' ? '#ff7f00' : '#ffd700';
            header.append("div")
                .style("background", priorityColor)
                .style("color", "white")
                .style("padding", "2px 6px")
                .style("border-radius", "10px")
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .text(d.priorityLevel);

            // Quick stats
            const stats = card.append("div")
                .style("display", "grid")
                .style("grid-template-columns", "1fr 1fr")
                .style("gap", "5px")
                .style("font-size", "11px")
                .style("margin-bottom", "8px");

            stats.append("div")
                .html(`<strong>${d.crashesBenefited}</strong> crashes benefited`);

            stats.append("div")
                .html(`<strong>${d.severityImpact}</strong> severe crashes`);

            // Targeted actions
            card.append("div")
                .style("font-size", "10px")
                .style("color", "#666")
                .html(`<strong>Targets:</strong> ${d.actionsTargeted.slice(0, 2).join(', ')}`);
        });
    }

    showSuggestionDetails(suggestion) {
        let vis = this;

        // Remove any existing detail tooltips first
        d3.selectAll(".suggestion-detail-tooltip").remove();

        // Create detailed tooltip
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "suggestion-detail-tooltip")
            .style("position", "fixed")
            .style("background", "rgba(255, 255, 255, 0.98)")
            .style("border", `3px solid ${suggestion.priorityLevel === 'High' ? '#e23725' :
                suggestion.priorityLevel === 'Medium' ? '#ff7f00' : '#ffd700'}`)
            .style("border-radius", "10px")
            .style("padding", "20px")
            .style("max-width", "500px")
            .style("max-height", "600px")
            .style("overflow-y", "auto")
            .style("box-shadow", "0 8px 25px rgba(0,0,0,0.2)")
            .style("z-index", "10000")
            .style("font-family", "Overpass, sans-serif")
            .style("pointer-events", "auto")
            .style("left", "50%")
            .style("top", "50%")
            .style("transform", "translate(-50%, -50%)");

        // Build specific solutions HTML
        let specificSolutionsHTML = '';
        if (suggestion.specificSolutions && suggestion.specificSolutions.length > 0) {
            specificSolutionsHTML = `
        <div style="margin-top: 15px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 14px;">Recommended Interventions:</div>
            ${suggestion.specificSolutions.map(sol => `
                <div style="background: #f0f8ff; padding: 10px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #1e90ff;">
                    <div style="font-weight: bold; color: #333;">${sol.name}</div>
                    <div style="font-size: 11px; color: #666;">
                        <strong>Type:</strong> ${sol.type} | 
                        <strong>Beneficiary:</strong> ${sol.beneficiary}
                    </div>
                    ${sol.contributingFactors ? `<div style="font-size: 10px; color: #888; margin-top: 3px;"><strong>Addresses:</strong> ${sol.contributingFactors}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
        }

        tooltip.html(`
    <div style="position: relative;">
        <!-- Close button - properly positioned -->
        <button class="close-suggestion-detail" 
                style="position: absolute; top: 10px; right: 10px; background: #e23725; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10002;">
            ×
        </button>
        
        <div style="display: flex; align-items: flex-start; margin-bottom: 15px; padding-right: 40px;">
            <span style="font-size: 32px; margin-right: 12px;">${suggestion.icon}</span>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 5px 0; color: #333;">${suggestion.title}</h3>
                <div style="color: #666; font-size: 14px; font-weight: bold;">${suggestion.improvementType}</div>
            </div>
        </div>
        
        <div style="margin-bottom: 15px; color: #555; line-height: 1.4;">
            ${suggestion.description}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="background: #e8f5e8; padding: 8px; border-radius: 6px;">
                <div style="font-size: 12px; color: #666;">Crashes Benefited</div>
                <div style="font-size: 18px; font-weight: bold; color: #4CAF50;">${suggestion.crashesBenefited}</div>
            </div>
            <div style="background: #ffe8e8; padding: 8px; border-radius: 6px;">
                <div style="font-size: 12px; color: #666;">Severe Crashes</div>
                <div style="font-size: 18px; font-weight: bold; color: #e23725;">${suggestion.severityImpact}</div>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; margin-bottom: 5px; color: #333;">Targeted Action Patterns:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                ${suggestion.actionsTargeted.map(action =>
            `<span style="background: #e3f2fd; color: #1976d2; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">${action}</span>`
        ).join('')}
            </div>
        </div>
        
        ${specificSolutionsHTML}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 15px; font-size: 12px;">
            <div><strong>Effectiveness:</strong><br>${suggestion.effectiveness}</div>
            <div><strong>Cost:</strong><br>${suggestion.cost}</div>
            <div><strong>Timeline:</strong><br>${suggestion.implementation}</div>
        </div>
        
        <div style="background: #fff3cd; padding: 10px; border-radius: 6px; border-left: 4px solid #ffc107;">
            <div style="font-weight: bold; color: #856404;">Priority: ${suggestion.priorityLevel}</div>
            <div style="font-size: 11px; color: #856404;">Based on crash frequency and severity impact</div>
        </div>
        
        ${suggestion.districts && suggestion.districts.length > 0 ? `
            <div style="margin-top: 10px; font-size: 11px; color: #666;">
                <strong>Top Districts:</strong> ${suggestion.districts.join(', ')}
            </div>
        ` : ''}
        
        <div style="margin-top: 15px; text-align: center;">
            <button class="close-suggestion-btn" 
                    style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Close Details
            </button>
        </div>
    </div>
`);

        // Add event handlers for both close buttons
        tooltip.select(".close-suggestion-detail")
            .on("click", function() {
                tooltip.remove();
                overlay.remove();
            });

        tooltip.select(".close-suggestion-btn")
            .on("click", function() {
                tooltip.remove();
                overlay.remove();
            });

        // Add click outside to close functionality
        const overlay = d3.select("body")
            .append("div")
            .attr("class", "tooltip-overlay")
            .style("position", "fixed")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("background", "rgba(0,0,0,0.5)")
            .style("z-index", "9999")
            .style("pointer-events", "auto")
            .on("click", function() {
                tooltip.remove();
                overlay.remove();
            });

        // Also close when pressing Escape key
        const escapeHandler = function(event) {
            if (event.key === "Escape") {
                tooltip.remove();
                overlay.remove();
                document.removeEventListener("keydown", escapeHandler);
            }
        };
        document.addEventListener("keydown", escapeHandler);

        // Clean up event listeners when tooltip is removed
        tooltip.on("remove", function() {
            overlay.remove();
            document.removeEventListener("keydown", escapeHandler);
        });
    }
    wrangleData() {
        let vis = this;

        console.log('ActionHotspotVis wrangleData called with:', {
            selectedActionType: vis.selectedActionType,
            selectedAction: vis.selectedAction,
            selectedYear: vis.selectedYear,
            displayMode: vis.displayMode
        });

        // If we're in empty map mode, don't process data
        if (vis.isEmptyMapMode) return;

        // Filter data using precomputed values - much faster
        vis.filteredData = vis.precomputedData.filter(d => {
            if (!d.hasValidCoords) return false;
            if (d.year !== vis.selectedYear) return false;

            if (vis.selectedActionType === 'All') {
                if (vis.selectedAction === 'All') {
                    return d.hasDriverAction || d.hasPedestrianAction || d.hasCyclistAction;
                } else {
                    let actionType = vis.selectedAction.split(': ')[0];
                    let actionValue = vis.selectedAction.split(': ')[1];

                    if (actionType === 'Driver') {
                        return d.driverAction === actionValue;
                    } else if (actionType === 'Pedestrian') {
                        return d.pedestrianAction === actionValue;
                    } else if (actionType === 'Cyclist') {
                        return d.cyclistAction === actionValue;
                    }
                }
            } else if (vis.selectedActionType === 'Driver') {
                if (vis.selectedAction === 'All') {
                    return d.hasDriverAction;
                } else {
                    return d.driverAction === vis.selectedAction;
                }
            } else if (vis.selectedActionType === 'Pedestrian') {
                if (vis.selectedAction === 'All') {
                    return d.hasPedestrianAction;
                } else {
                    return d.pedestrianAction === vis.selectedAction;
                }
            } else if (vis.selectedActionType === 'Cyclist') {
                if (vis.selectedAction === 'All') {
                    return d.hasCyclistAction;
                } else {
                    return d.cyclistAction === vis.selectedAction;
                }
            }
            return false;
        });

        console.log('Filtered data count:', vis.filteredData.length);
        console.log('Sample filtered data:', vis.filteredData.slice(0, 3));

        // Prepare data based on display mode
        if (vis.displayMode === 'individual') {
            vis.prepareIndividualData();
        } else {
            vis.prepareClusterData();
        }

        vis.updateVis();
    }

    prepareIndividualData() {
        let vis = this;

        // Create individual points data using precomputed values
        vis.individualData = vis.filteredData.map(d => {
            return {
                lat: d.lat,
                lng: d.lng,
                x: vis.xScale(d.lng),
                y: vis.yScale(d.lat),
                actionType: d.actionType,
                color: d.color,
                originalData: d.originalData
            };
        });
    }

    prepareClusterData() {
        let vis = this;

        // Use grid-based clustering instead of distance-based - much faster O(n)
        const gridSize = 0.005; // ~500m grid
        const clustersMap = new Map();

        vis.filteredData.forEach(d => {
            const gridKey = `${Math.floor(d.lat / gridSize)}_${Math.floor(d.lng / gridSize)}`;

            if (!clustersMap.has(gridKey)) {
                clustersMap.set(gridKey, {
                    centerLat: d.lat,
                    centerLng: d.lng,
                    points: [d.originalData], // Store original data for location analysis
                    count: 1,
                    // OPTIMIZED: Track counts during clustering
                    actionCounts: {},
                    actionTypeCounts: {Driver: 0, Pedestrian: 0, Cyclist: 0},
                    // NEW: Track location information
                    locations: {},
                    streets: {},
                    districts: {}
                });

                // Initialize counts for first point
                const cluster = clustersMap.get(gridKey);
                if (d.hasDriverAction) {
                    cluster.actionCounts[`Driver: ${d.driverAction}`] = 1;
                    cluster.actionTypeCounts.Driver++;
                }
                if (d.hasPedestrianAction) {
                    cluster.actionCounts[`Pedestrian: ${d.pedestrianAction}`] = 1;
                    cluster.actionTypeCounts.Pedestrian++;
                }
                if (d.hasCyclistAction) {
                    cluster.actionCounts[`Cyclist: ${d.cyclistAction}`] = 1;
                    cluster.actionTypeCounts.Cyclist++;
                }

                // Initialize location tracking
                const location = d.originalData['Collision Location'] || 'Unknown Location';
                cluster.locations[location] = 1;

                if (d.originalData.STREET1 && d.originalData.STREET2) {
                    const intersection = `${d.originalData.STREET1} & ${d.originalData.STREET2}`;
                    cluster.streets[intersection] = 1;
                } else if (d.originalData.STREET1) {
                    cluster.streets[d.originalData.STREET1] = 1;
                }

                const district = d.originalData.DISTRICT || d.originalData['District Name'] || 'Unknown District';
                cluster.districts[district] = 1;

            } else {
                const cluster = clustersMap.get(gridKey);
                cluster.points.push(d.originalData);
                cluster.count++;

                // OPTIMIZED: Update counts during clustering instead of recalculating later
                if (d.hasDriverAction) {
                    cluster.actionCounts[`Driver: ${d.driverAction}`] = (cluster.actionCounts[`Driver: ${d.driverAction}`] || 0) + 1;
                    cluster.actionTypeCounts.Driver++;
                }
                if (d.hasPedestrianAction) {
                    cluster.actionCounts[`Pedestrian: ${d.pedestrianAction}`] = (cluster.actionCounts[`Pedestrian: ${d.pedestrianAction}`] || 0) + 1;
                    cluster.actionTypeCounts.Pedestrian++;
                }
                if (d.hasCyclistAction) {
                    cluster.actionCounts[`Cyclist: ${d.cyclistAction}`] = (cluster.actionCounts[`Cyclist: ${d.cyclistAction}`] || 0) + 1;
                    cluster.actionTypeCounts.Cyclist++;
                }

                // Update location tracking
                const location = d.originalData['Collision Location'] || 'Unknown Location';
                cluster.locations[location] = (cluster.locations[location] || 0) + 1;

                if (d.originalData.STREET1 && d.originalData.STREET2) {
                    const intersection = `${d.originalData.STREET1} & ${d.originalData.STREET2}`;
                    cluster.streets[intersection] = (cluster.streets[intersection] || 0) + 1;
                } else if (d.originalData.STREET1) {
                    cluster.streets[d.originalData.STREET1] = (cluster.streets[d.originalData.STREET1] || 0) + 1;
                }

                const district = d.originalData.DISTRICT || d.originalData['District Name'] || 'Unknown District';
                cluster.districts[district] = (cluster.districts[district] || 0) + 1;

                // Update center using running average (faster than recalculating from all points)
                cluster.centerLat = (cluster.centerLat * (cluster.count - 1) + d.lat) / cluster.count;
                cluster.centerLng = (cluster.centerLng * (cluster.count - 1) + d.lng) / cluster.count;
            }
        });

        // Convert map to array and calculate final cluster properties
        vis.clusterData = Array.from(clustersMap.values()).map(cluster => {
            // OPTIMIZED: Find top action without expensive reduce
            let topAction = 'No Action Data';
            let maxCount = 0;
            for (let action in cluster.actionCounts) {
                if (cluster.actionCounts[action] > maxCount) {
                    maxCount = cluster.actionCounts[action];
                    topAction = action;
                }
            }

            // Determine dominant type for color
            let dominantType = 'Driver';
            if (cluster.actionTypeCounts.Pedestrian >= cluster.actionTypeCounts.Driver && cluster.actionTypeCounts.Pedestrian >= cluster.actionTypeCounts.Cyclist) {
                dominantType = 'Pedestrian';
            } else if (cluster.actionTypeCounts.Cyclist >= cluster.actionTypeCounts.Driver && cluster.actionTypeCounts.Cyclist >= cluster.actionTypeCounts.Pedestrian) {
                dominantType = 'Cyclist';
            }

            // Find most common location information
            const mostCommonLocation = Object.entries(cluster.locations)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various Locations';

            const mostCommonStreet = Object.entries(cluster.streets)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various Streets';

            const mostCommonDistrict = Object.entries(cluster.districts)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various Districts';

            return {
                lat: cluster.centerLat,
                lng: cluster.centerLng,
                x: vis.xScale(cluster.centerLng),
                y: vis.yScale(cluster.centerLat),
                count: cluster.count,
                topAction: topAction,
                actionCounts: cluster.actionCounts,
                actionTypeCounts: cluster.actionTypeCounts,
                dominantType: dominantType,
                color: vis.actionTypeColors[dominantType],
                points: cluster.points,
                // NEW: Include location information
                mostCommonLocation: mostCommonLocation,
                mostCommonStreet: mostCommonStreet,
                mostCommonDistrict: mostCommonDistrict,
                locations: cluster.locations,
                streets: cluster.streets,
                districts: cluster.districts
            };
        });

        console.log('Created clusters:', vis.clusterData.length);
    }
    updateVis() {
        let vis = this;

        // If we're in empty map mode, don't update the visualization
        if (vis.isEmptyMapMode) return;

        // Update year display
        if (vis.yearDisplay) {
            vis.yearDisplay.text(`Year: ${vis.selectedYear}`);
        }

        // Clear existing points
        vis.svg.selectAll(".action-cluster, .individual-point").remove();

        if (vis.displayMode === 'individual') {
            vis.showIndividualPoints();
        } else {
            vis.showClusters();
        }

        // Ensure district labels stay on top
        vis.svg.select(".district-labels")
            .raise(); // Move to top of SVG

        // Update title
        vis.updateTitle(`${vis.selectedActionType} Action ${vis.displayMode === 'individual' ? 'Points' : 'Hotspots'} (${vis.selectedYear}): ${vis.selectedAction === 'All' ? 'All Actions' : vis.selectedAction}`);
    }

    showIndividualPoints() {
        let vis = this;

        vis.individualPoints = vis.zoomableLayer.selectAll(".individual-point")
            .data(vis.individualData)
            .enter()
            .append("circle")
            .attr("class", "individual-point")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 5)
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("opacity", 0.7)
            .on("mouseover", function (event, d) {
                vis.showIndividualTooltip(event, d);
            })
            .on("mouseout", function () {
                vis.hideTooltip();
            })
            .on("click", function (event, d) {
                event.stopPropagation();
                console.log('Individual point clicked:', d);

                // Remove any existing gist first
                vis.hideSolutionGist();

                // Show detailed view on click
                vis.showDetailedView(d);

                // Highlight the clicked point
                vis.zoomableLayer.selectAll(".individual-point")
                    .attr("stroke-width", 1)
                    .attr("opacity", 0.7);
                d3.select(this)
                    .attr("stroke-width", 3)
                    .attr("opacity", 1);
            });
    }

    showClusters() {
        let vis = this;

        // Size scale based on cluster size
        vis.sizeScale = d3.scaleSqrt()
            .domain([1, d3.max(vis.clusterData, d => d.count)])
            .range([8, 35]);

        // Create clusters with simplified rendering
        vis.clusters = vis.zoomableLayer.selectAll(".action-cluster")
            .data(vis.clusterData)
            .enter()
            .append("circle")
            .attr("class", "action-cluster")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => vis.sizeScale(d.count))
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("opacity", 0.8)
            .on("mouseover", function(event, d) {
                // Only show tooltip on hover, NOT the solution gist
                vis.showClusterTooltip(event, d);
            })
            .on("mouseout", function() {
                // Only hide tooltip on mouseout
                vis.hideTooltip();
            })
            .on("click", function(event, d) {
                event.stopPropagation(); // Prevent event bubbling

                // Remove any existing gist first
                vis.hideSolutionGist();

                // Show detailed view on click
                vis.showDetailedView(d);

                // Highlight the clicked cluster
                vis.zoomableLayer.selectAll(".action-cluster")
                    .attr("stroke-width", 2)
                    .attr("opacity", 0.8);
                d3.select(this)
                    .attr("stroke-width", 4)
                    .attr("opacity", 1);
            });
    }


    showIndividualTooltip(event, d) {
        let vis = this;

        let driverAction = (d.originalData['Apparent Driver Action'] || '').trim();
        let pedestrianAction = (d.originalData['Pedestrian Action'] || '').trim();
        let cyclistAction = (d.originalData['Cyclist Action'] || '').trim();

        let actionDetails = [];
        if (driverAction && driverAction !== '' && driverAction !== 'Unknown') {
            actionDetails.push(`Driver: ${driverAction}`);
        }
        if (pedestrianAction && pedestrianAction !== '' && pedestrianAction !== 'Unknown') {
            actionDetails.push(`Pedestrian: ${pedestrianAction}`);
        }
        if (cyclistAction && cyclistAction !== '' && cyclistAction !== 'Unknown') {
            actionDetails.push(`Cyclist: ${cyclistAction}`);
        }

        vis.tooltip
            .style("opacity", 1)
            .html(`
                <strong>Accident Details (${vis.selectedYear}):</strong><br>
                Action Type: <span style="color: ${d.color}; font-weight: bold;">${d.actionType}</span><br>
                ${actionDetails.join('<br>')}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    showClusterTooltip(event, d) {
        let vis = this;

        let actionList = Object.entries(d.actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([action, count]) => `${action}: ${count}`)
            .join('<br>');

        let typeBreakdown = Object.entries(d.actionTypeCounts)
            .filter(([type, count]) => count > 0)
            .map(([type, count]) => {
                let color = vis.actionTypeColors[type];
                return `<span style="color: ${color}; font-weight: bold;">${type}: ${count}</span>`;
            })
            .join('<br>');

        vis.tooltip
            .style("opacity", 1)
            .html(`
                <strong>Hotspot Details (${vis.selectedYear}):</strong><br>
                Total Accidents: ${d.count}<br>
                <span style="color: ${d.color}; font-weight: bold;">Dominant Type: ${d.dominantType}</span><br>
                <br>
                <strong>Action Type Breakdown:</strong><br>
                ${typeBreakdown}<br>
                <br>
                <strong>Top Actions:</strong><br>
                ${actionList}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    hideTooltip() {
        let vis = this;
        vis.tooltip.style("opacity", 0);
    }

    updateTitle(title) {
        let vis = this;

        // Remove existing title
        vis.svg.selectAll(".vis-title").remove();

        // Add new title
        vis.svg.append("text")
            .attr("class", "vis-title")
            .attr("x", vis.width / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text(title);
    }

    createYearDisplay() {
        let vis = this;

        vis.yearDisplay = vis.svg.append("text")
            .attr("class", "year-display")
            .attr("x", vis.width - 10)
            .attr("y", vis.height - 10)
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text(`Year: ${vis.selectedYear}`);
    }

    setYear(year) {
        let vis = this;
        vis.selectedYear = year;

        if (vis.yearDisplay) {
            vis.yearDisplay.text(`Year: ${vis.selectedYear}`);
        }

        if (!vis.isEmptyMapMode) {
            vis.wrangleData();
        }
    }

    hideSolutionGist() {
        let vis = this;
        if (vis.solutionGist) {
            vis.solutionGist
                .transition()
                .duration(100)
                .style("opacity", 0)
                .remove();
            vis.solutionGist = null;
        }
    }

    getSolutionsForDataPoint(d) {
        let vis = this;

        // Extract action information from the data point
        let actionType, specificAction;

        if (d.originalData) {
            const data = d.originalData;

            // Determine which action type this point represents
            if (data['Apparent Driver Action'] && data['Apparent Driver Action'] !== '' && data['Apparent Driver Action'] !== 'Unknown') {
                actionType = 'Driver';
                specificAction = data['Apparent Driver Action'];
            } else if (data['Pedestrian Action'] && data['Pedestrian Action'] !== '' && data['Pedestrian Action'] !== 'Unknown') {
                actionType = 'Pedestrian';
                specificAction = data['Pedestrian Action'];
            } else if (data['Cyclist Action'] && data['Cyclist Action'] !== '' && data['Cyclist Action'] !== 'Unknown') {
                actionType = 'Cyclist';
                specificAction = data['Cyclist Action'];
            } else {
                actionType = d.actionType;
                specificAction = '';
            }
        } else if (d.topAction) {
            // Cluster
            actionType = d.topAction.split(': ')[0];
            specificAction = d.topAction.split(': ')[1];
        } else {
            actionType = d.dominantType || d.actionType;
            specificAction = '';
        }

        console.log('Finding solutions for:', { actionType, specificAction });

        const relevantSolutions = vis.improvementSuggestions.solutionsData.filter(solution => {
            const beneficiary = (solution['Primary Beneficiary'] || '').toLowerCase();
            const initiative = (solution['Initiative Name'] || '').toLowerCase();
            const factors = (solution['Contributing Factor(s)'] || '').toLowerCase();

            // Match by beneficiary
            if (!beneficiary.includes(actionType.toLowerCase())) {
                return false;
            }

            // Additional matching based on specific action patterns
            if (specificAction) {
                const actionLower = specificAction.toLowerCase();

                // Speed-related actions
                if ((actionLower.includes('speed') || actionLower.includes('fast') || actionLower.includes('racing')) &&
                    (initiative.includes('speed') || factors.includes('speed') || initiative.includes('enforcement'))) {
                    return true;
                }

                // Distraction-related actions
                if ((actionLower.includes('distract') || actionLower.includes('phone') || actionLower.includes('text')) &&
                    (initiative.includes('distract') || factors.includes('distract') || initiative.includes('phone'))) {
                    return true;
                }

                // Alcohol-related actions
                if ((actionLower.includes('alcohol') || actionLower.includes('impaired') || actionLower.includes('drink')) &&
                    (initiative.includes('alcohol') || factors.includes('alcohol') || initiative.includes('impaired'))) {
                    return true;
                }

                // Lost control actions
                if ((actionLower.includes('lost control') || actionLower.includes('control')) &&
                    (initiative.includes('control') || factors.includes('control') || initiative.includes('road'))) {
                    return true;
                }

                // Intersection-related actions
                if ((actionLower.includes('turn') || actionLower.includes('intersection') || actionLower.includes('signal')) &&
                    (initiative.includes('intersection') || initiative.includes('turn') || initiative.includes('signal'))) {
                    return true;
                }

                // Pedestrian crossing actions
                if ((actionLower.includes('cross') || actionLower.includes('walk') || actionLower.includes('pedestrian')) &&
                    (initiative.includes('cross') || initiative.includes('pedestrian') || initiative.includes('walk'))) {
                    return true;
                }

                // Cyclist actions
                if ((actionLower.includes('cyclist') || actionLower.includes('bicycle') || actionLower.includes('bike')) &&
                    (initiative.includes('cyclist') || initiative.includes('bicycle') || initiative.includes('bike'))) {
                    return true;
                }

                // General matching for any relevant terms
                const actionWords = actionLower.split(' ');
                for (let word of actionWords) {
                    if (word.length > 4 && (initiative.includes(word) || factors.includes(word))) {
                        return true;
                    }
                }
            }

            // If no specific action matching, return solutions for this beneficiary type
            return true;
        });

        // Sort by relevance score
        const scoredSolutions = relevantSolutions.map(solution => {
            let score = 0;
            score += 10;
            if (specificAction) {
                score += vis.improvementSuggestions.matchSolutionToAction(solution, actionType, specificAction);
            }

            return { solution, score };
        }).sort((a, b) => b.score - a.score)
            .map(item => item.solution);

        console.log(`Found ${scoredSolutions.length} relevant solutions for "${specificAction}"`);
        return scoredSolutions.slice(0, 3); // Return top 3 most relevant solutions
    }

    buildDetailedViewHTML(data, solutions, isCluster) {
        let vis = this;

        const accidentInfo = isCluster ?
            this.extractAccidentInfo(data, isCluster) :
            this.extractIndividualAccidentInfo(data);

        const actionAnalysis = isCluster ?
            this.extractActionAnalysis(data, isCluster) :
            this.extractIndividualActionAnalysis(data);

        const icon = isCluster ? '🔍' : '📌';
        const title = isCluster ? `Accident Hotspot Analysis` : `Individual Accident Analysis`;
        const subtitle = isCluster ?
            `${data.count} accidents detected in this area` :
            'Detailed single accident analysis';

        return `
    <div style="display: flex; flex-direction: column; height: 100%;">
        <!-- Header - Fixed -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 25px; border-radius: 12px 12px 0 0; flex-shrink: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 28px; margin-right: 12px;">${icon}</span>
                    <h2 style="margin: 0; font-size: 22px; font-weight: bold;">${title}</h2>
                </div>
                <button class="close-detailed-view" 
                        style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 18px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                    ×
                </button>
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
                ${subtitle}
            </div>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: min-content;">
                
                <div style="padding: 25px; border-right: 1px solid #eee; background: #fafafa;">
                    <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">
                        ${isCluster ? '📊 Cluster Statistics' : '📊 Accident Details'}
                    </h3>
                    
                    ${accidentInfo}
                    
                    <div style="margin-top: 25px;">
                        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">
                            ${isCluster ? '🚦 Action Patterns' : '🚦 Action Analysis'}
                        </h3>
                        ${actionAnalysis}
                    </div>
                </div>
                <div style="padding: 25px; background: white;">
                    <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">
                        💡 Recommended Solutions
                    </h3>
                    
                    ${solutions.length > 0 ?
            this.buildSolutionsSection(solutions, isCluster) :
            this.buildNoSolutionsHTML()
        }
                    <div style="margin-top: 25px; text-align: center;">
                        <button class="view-full-solutions" 
                                style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.3s ease;">
                            View Full Safety Analysis ›
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
    }

    getSolutionIcon(solutionType) {
        const icons = {
            'Road Infrastructure': '🏗️',
            'Technology': '🔧',
            'Policy': '📋',
            'Education': '📚',
            'Communication': '📢',
            'Road Users': '🚶',
            'Vehicles': '🚗'
        };
        return icons[solutionType] || '✅';
    }

    showSolutionDetails(solution, dataPoint) {
        let vis = this;
        vis.hideSolutionGist();

        const solutionDetail = d3.select("body")
            .append("div")
            .attr("class", "solution-detail-modal")
            .style("position", "fixed")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("background", "rgba(0,0,0,0.7)")
            .style("z-index", "10001")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("pointer-events", "auto");

        const modalContent = solutionDetail.append("div")
            .style("background", "white")
            .style("border-radius", "12px")
            .style("padding", "30px")
            .style("max-width", "800px")
            .style("max-height", "85vh")
            .style("width", "90%")
            .style("overflow-y", "auto")
            .style("box-shadow", "0 20px 50px rgba(0,0,0,0.4)")
            .style("position", "relative");

        const icon = vis.getSolutionIcon(solution['Type']);
        const beneficiary = solution['Primary Beneficiary'] || 'General';
        const type = solution['Type'] || 'General';
        const riskGroups = solution['Risk Group(s)'] || 'All road users';
        const factors = solution['Contributing Factor(s)'] || 'Various factors';
        const interventions = solution['Road Safety Interventions'] || 'Multiple interventions';

        modalContent.html(`
    <div style="position: relative;">
        <button class="close-solution-detail" 
                style="position: absolute; top: -15px; right: -15px; background: #e23725; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; font-size: 18px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10002; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            ×
        </button>
        
        <div style="display: flex; align-items: flex-start; margin-bottom: 25px; padding-right: 20px;">
            <span style="font-size: 48px; margin-right: 20px;">${icon}</span>
            <div style="flex: 1;">
                <h2 style="margin: 0 0 12px 0; color: #333; font-size: 24px; line-height: 1.3;">${solution['Initiative Name']}</h2>
                <div style="color: #666; font-size: 16px; font-weight: bold;">${type} • ${beneficiary}</div>
            </div>
        </div>
        
        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #1e90ff;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px; font-size: 16px;">Applied to:</div>
            <div style="font-size: 14px; color: #666;">
                ${dataPoint.originalData ? 'Individual accident' : 'Accident hotspot'} with 
                ${dataPoint.originalData ? 'specific action pattern' : dataPoint.count + ' accidents'}
            </div>
        </div>
        
        <div style="margin-bottom: 25px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">Solution Details</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 14px; color: #666; font-weight: bold; margin-bottom: 5px;">Primary Beneficiary</div>
                    <div style="font-size: 16px; color: #2e7d32; font-weight: bold;">${beneficiary}</div>
                </div>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 14px; color: #666; font-weight: bold; margin-bottom: 5px;">Solution Type</div>
                    <div style="font-size: 16px; color: #1976d2; font-weight: bold;">${type}</div>
                </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-weight: bold; color: #856404; margin-bottom: 8px; font-size: 15px;">Targeted Risk Groups</div>
                <div style="font-size: 14px; color: #856404; line-height: 1.4;">${riskGroups}</div>
            </div>
            
            <div style="background: #fce4ec; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-weight: bold; color: #880e4f; margin-bottom: 8px; font-size: 15px;">Addresses These Factors</div>
                <div style="font-size: 14px; color: #880e4f; line-height: 1.4;">${factors}</div>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
                <div style="font-weight: bold; color: #2e7d32; margin-bottom: 8px; font-size: 15px;">Implementation Approach</div>
                <div style="font-size: 14px; color: #2e7d32; line-height: 1.4;">${interventions}</div>
            </div>
        </div>
        
        <!-- Expected benefits -->
        <div style="margin-bottom: 25px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">Expected Benefits</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div style="text-align: center; background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">High</div>
                    <div style="font-size: 13px; color: #666; margin-top: 5px;">Effectiveness</div>
                </div>
                <div style="text-align: center; background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #ff9800;">Medium</div>
                    <div style="font-size: 13px; color: #666; margin-top: 5px;">Cost Level</div>
                </div>
                <div style="text-align: center; background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #2196f3;">6-12 mo</div>
                    <div style="font-size: 13px; color: #666; margin-top: 5px;">Timeline</div>
                </div>
            </div>
        </div>
        
        <!-- Action buttons -->
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
            <button class="close-modal-btn" 
                    style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.3s ease;">
                Close
            </button>
            <button class="view-full-analysis-btn" 
                    style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.3s ease;">
                View Full Analysis
            </button>
        </div>
    </div>
`);

        // Add event handlers
        modalContent.select(".close-solution-detail")
            .on("click", function() {
                solutionDetail.remove();
            });

        modalContent.select(".close-modal-btn")
            .on("click", function() {
                solutionDetail.remove();
            });

        modalContent.select(".view-full-analysis-btn")
            .on("click", function() {
                solutionDetail.remove();
                // Show the full improvement suggestions panel
                vis.toggleImprovementSuggestions();
            });

        // Close when clicking outside
        solutionDetail.on("click", function(event) {
            if (event.target === this) {
                solutionDetail.remove();
            }
        });

        // Close with Escape key
        const escapeHandler = function(event) {
            if (event.key === "Escape") {
                solutionDetail.remove();
                document.removeEventListener("keydown", escapeHandler);
            }
        };
        document.addEventListener("keydown", escapeHandler);

        // Clean up
        solutionDetail.on("remove", function() {
            document.removeEventListener("keydown", escapeHandler);
        });
    }

    showDetailedView(data) {
        let vis = this;

        console.log('showDetailedView called with:', data);

        // Remove any existing detailed view
        vis.hideDetailedView();

        const isCluster = !data.originalData;
        console.log('Is cluster:', isCluster, 'Data type:', typeof data);

        const solutions = vis.getSolutionsForDataPoint(data);
        console.log('Found solutions:', solutions.length);

        vis.detailedView = d3.select("body")
            .append("div")
            .attr("class", "detailed-view-modal")
            .style("position", "fixed")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("background", "rgba(0,0,0,0.7)")
            .style("z-index", "10000")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("pointer-events", "auto")
            .style("padding", "20px");

        const modalContent = vis.detailedView.append("div")
            .style("background", "white")
            .style("border-radius", "12px")
            .style("padding", "0")
            .style("width", "100%")
            .style("max-width", "1000px")
            .style("height", "100%")
            .style("max-height", "90vh")
            .style("overflow", "hidden")
            .style("box-shadow", "0 20px 50px rgba(0,0,0,0.4)")
            .style("display", "flex")
            .style("flex-direction", "column");

        try {
            const htmlContent = vis.buildDetailedViewHTML(data, solutions, isCluster);
            modalContent.html(htmlContent);
            console.log('Modal content built successfully');
        } catch (error) {
            console.error('Error building modal content:', error);
            modalContent.html(`
        <div style="padding: 40px; text-align: center; color: #666; height: 100%; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <h3>Error Loading Details</h3>
            <p>There was an error displaying the accident details.</p>
            <button class="close-detailed-view" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
                Close
            </button>
        </div>
    `);
        }

        modalContent.selectAll(".clickable-solution-detailed")
            .on("click", function(event) {
                event.stopPropagation();
                const solutionIndex = +this.getAttribute("data-solution-index");
                const solution = solutions[solutionIndex];
                console.log('Solution clicked:', solutionIndex, solution);
                vis.showSolutionDetails(solution, data);
            });

        modalContent.select(".close-detailed-view")
            .on("click", function() {
                vis.hideDetailedView();
            });

        modalContent.select(".view-full-solutions")
            .on("click", function() {
                vis.hideDetailedView();
                vis.toggleImprovementSuggestions();
            });

        vis.detailedView.on("click", function(event) {
            if (event.target === this) {
                vis.hideDetailedView();
            }
        });

        vis.escapeHandler = function(event) {
            if (event.key === "Escape") {
                vis.hideDetailedView();
            }
        };
        document.addEventListener("keydown", vis.escapeHandler);
    }
    hideDetailedView() {
        let vis = this;
        if (vis.detailedView) {
            vis.detailedView.remove();
            vis.detailedView = null;
            document.removeEventListener("keydown", vis.escapeHandler);

            vis.svg.selectAll(".individual-point, .action-cluster")
                .attr("stroke-width", function() {
                    return d3.select(this).classed("action-cluster") ? 2 : 1;
                })
                .attr("opacity", function() {
                    return d3.select(this).classed("action-cluster") ? 0.8 : 0.7;
                });
        }
    }

    extractAccidentInfo(data, isCluster) {
        let vis = this;

        if (isCluster) {
            const locationCounts = {};
            const streetCounts = {};
            const districtCounts = {};

            data.points.forEach(point => {
                // Count locations
                const location = point['Collision Location'] || 'Unknown Location';
                locationCounts[location] = (locationCounts[location] || 0) + 1;

                if (point.STREET1 && point.STREET2) {
                    const intersection = `${point.STREET1} & ${point.STREET2}`;
                    streetCounts[intersection] = (streetCounts[intersection] || 0) + 1;
                } else if (point.STREET1) {
                    streetCounts[point.STREET1] = (streetCounts[point.STREET1] || 0) + 1;
                }

                const district = point.DISTRICT || point['District Name'] || 'Unknown District';
                districtCounts[district] = (districtCounts[district] || 0) + 1;
            });

            const mostCommonLocation = Object.entries(locationCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various Locations';

            // Find most common intersection/street
            const mostCommonStreet = Object.entries(streetCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various Streets';

            // Find most common district
            const mostCommonDistrict = Object.entries(districtCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various Districts';

            const severityCounts = data.points.reduce((acc, point) => {
                const severity = point.Severity || 'Minimal';
                acc[severity] = (acc[severity] || 0) + 1;
                return acc;
            }, {});

            const severityHTML = Object.entries(severityCounts)
                .map(([severity, count]) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="color: #666;">${severity}:</span>
                    <span style="font-weight: bold; color: #333;">${count}</span>
                </div>
            `).join('');

            return `
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #667eea;">${data.count}</div>
                    <div style="font-size: 12px; color: #666;">Total Accidents</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${Object.keys(data.actionTypeCounts).length}</div>
                    <div style="font-size: 12px; color: #666;">Action Types</div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Severity Breakdown:</div>
                ${severityHTML}
            </div>
            
            <div>
                <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Location:</div>
                <div style="font-size: 14px; color: #333; font-weight: bold; margin-bottom: 5px;">
                    ${mostCommonStreet}
                </div>
                <div style="font-size: 12px; color: #666; margin-bottom: 3px;">
                    ${mostCommonDistrict}
                </div>
                <div style="font-size: 11px; color: #888; font-style: italic;">
                    ${mostCommonLocation}
                </div>
                <div style="font-size: 10px; color: #999; margin-top: 5px;">
                    (Approx: Lat ${data.lat.toFixed(4)}, Lng ${data.lng.toFixed(4)})
                </div>
            </div>
        </div>
    `;
        } else {
            const point = data.originalData;
            const severity = point.Severity || 'Minimal';
            const severityColor = {
                'Fatal': '#e23725',
                'Major': '#ff7f00',
                'Minor': '#ffd700',
                'Minimal': '#6c757d'
            }[severity];

            return `
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #667eea;">${point.Year || 'N/A'}</div>
                    <div style="font-size: 12px; color: #666;">Year</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: ${severityColor};">${severity}</div>
                    <div style="font-size: 12px; color: #666;">Severity</div>
                </div>
            </div>
            
            ${point['Time of Collision'] ? `
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 3px;">Time:</div>
                    <div style="font-size: 12px; color: #666;">${point['Time of Collision']}</div>
                </div>
            ` : ''}
            
            <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; color: #333; margin-bottom: 3px;">Location:</div>
                <div style="font-size: 12px; color: #666;">
                    ${point.STREET1 || 'Unknown'}${point.STREET2 ? ` & ${point.STREET2}` : ''}
                </div>
                <div style="font-size: 11px; color: #888; margin-top: 2px;">
                    ${point['Toronto Neighbourhood Name'] || 'Unknown'} • ${point.DISTRICT || 'Unknown District'}
                </div>
                <div style="font-size: 10px; color: #999; margin-top: 2px;">
                    Lat: ${point.LATITUDE?.toFixed(4) || 'N/A'}, Lng: ${point.LONGITUDE?.toFixed(4) || 'N/A'}
                </div>
            </div>
            
            ${point['District Name'] ? `
                <div style="margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 3px;">District:</div>
                    <div style="font-size: 12px; color: #666;">${point['District Name']}</div>
                </div>
            ` : ''}
            
            ${point['Neighbourhood Name'] ? `
                <div>
                    <div style="font-weight: bold; color: #333; margin-bottom: 3px;">Neighbourhood:</div>
                    <div style="font-size: 12px; color: #666;">${point['Neighbourhood Name']}</div>
                </div>
            ` : ''}
        </div>
    `;
        }
    }
    extractActionAnalysis(data, isCluster) {
        let vis = this;

        if (isCluster) {
            const topActions = Object.entries(data.actionCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            const actionHTML = topActions.map(([action, count]) => {
                const [type, specificAction] = action.split(': ');
                const color = vis.actionTypeColors[type] || '#666';
                return `
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                    <div>
                        <span style="display: inline-block; width: 8px; height: 8px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>
                        <span style="font-size: 12px; color: #333;">${specificAction}</span>
                    </div>
                    <span style="font-weight: bold; color: #667eea;">${count}</span>
                </div>
            `;
            }).join('');

            const typeBreakdown = Object.entries(data.actionTypeCounts)
                .filter(([_, count]) => count > 0)
                .map(([type, count]) => {
                    const color = vis.actionTypeColors[type];
                    return `
                    <div style="display: flex; justify-content: between; margin-bottom: 5px;">
                        <span style="color: ${color}; font-weight: bold;">${type}:</span>
                        <span style="font-weight: bold;">${count}</span>
                    </div>
                `;
                }).join('');

            return `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
                <div style="margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Dominant Action Type:</div>
                    <div style="color: ${vis.actionTypeColors[data.dominantType]}; font-weight: bold; font-size: 16px;">
                        ${data.dominantType}
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Action Type Breakdown:</div>
                    ${typeBreakdown}
                </div>
                
                <div>
                    <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Top 5 Actions:</div>
                    ${actionHTML}
                </div>
            </div>
        `;
        } else {
            const point = data.originalData;
            const actions = [];

            if (point.DriverAction && point.DriverAction !== '' && point.DriverAction !== 'Unknown') {
                actions.push(`<span style="color: ${vis.actionTypeColors.Driver};">Driver: ${point.DriverAction}</span>`);
            }
            if (point.PedestrianAction && point.PedestrianAction !== '' && point.PedestrianAction !== 'Unknown') {
                actions.push(`<span style="color: ${vis.actionTypeColors.Pedestrian};">Pedestrian: ${point.PedestrianAction}</span>`);
            }
            if (point.CyclistAction && point.CyclistAction !== '' && point.CyclistAction !== 'Unknown') {
                actions.push(`<span style="color: ${vis.actionTypeColors.Cyclist};">Cyclist: ${point.CyclistAction}</span>`);
            }

            return `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
                <div style="margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Primary Action Type:</div>
                    <div style="color: ${data.color}; font-weight: bold; font-size: 16px;">
                        ${data.actionType}
                    </div>
                </div>
                
                <div>
                    <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Specific Actions:</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${actions.length > 0 ?
                actions.map(action => `
                                <div style="padding: 8px; background: #f8f9fa; border-radius: 6px; font-size: 12px;">
                                    ${action}
                                </div>
                            `).join('') :
                '<div style="color: #666; font-style: italic; font-size: 12px;">No specific action data available</div>'
            }
                    </div>
                </div>
            </div>
        `;
        }
    }

    buildSolutionsSection(solutions, isCluster) {
        let vis = this;

        const contextText = isCluster ?
            'Based on the action patterns in this hotspot' :
            'Based on the specific actions in this accident';

        return `
        <div style="margin-bottom: 20px;">
            <div style="color: #666; font-size: 13px; margin-bottom: 15px;">
                ${contextText}, these solutions are recommended:
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${solutions.map((solution, index) => {
            const icon = vis.getSolutionIcon(solution['Type']);
            const type = solution['Type'] || 'General';
            const beneficiary = solution['Primary Beneficiary'] || 'General';
            const factors = solution['Contributing Factor(s)'] || 'Various safety factors';
            const effectiveness = vis.getEffectivenessRating(solution['Type']);

            return `
                        <div class="clickable-solution-detailed" 
                             data-solution-index="${index}"
                             style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50; cursor: pointer; transition: all 0.3s ease;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                                <span style="font-size: 20px; margin-right: 10px;">${icon}</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #333; font-size: 14px; margin-bottom: 4px;">
                                        ${solution['Initiative Name']}
                                    </div>
                                    <div style="font-size: 11px; color: #666;">
                                        ${type} • ${beneficiary}
                                    </div>
                                </div>
                            </div>
                            <div style="font-size: 12px; color: #666; margin-bottom: 8px; line-height: 1.4;">
                                ${factors}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 10px; color: #4CAF50; font-weight: bold;">
                                    Click for details ›
                                </span>
                                <span style="font-size: 10px; color: #666; background: #f0f0f0; padding: 2px 6px; border-radius: 10px;">
                                    ${effectiveness} effectiveness
                                </span>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        </div>
    `;
    }

    buildNoSolutionsHTML() {
        return `
        <div style="text-align: center; padding: 30px 20px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 15px;">🔍</div>
            <div style="font-weight: bold; margin-bottom: 8px;">No Specific Solutions Found</div>
            <div style="font-size: 13px; margin-bottom: 20px;">
                Try viewing the full safety analysis for broader recommendations.
            </div>
        </div>
    `;
    }

    getEffectivenessRating(solutionType) {
        const ratings = {
            'Road Infrastructure': 'High',
            'Technology': 'High',
            'Policy': 'Medium-High',
            'Road Users': 'Medium',
            'Education': 'Medium',
            'Communication': 'Low-Medium',
            'General': 'Medium'
        };
        return ratings[solutionType] || 'Medium';
    }

    extractIndividualAccidentInfo(data) {
        let vis = this;
        const point = data.originalData;

        // Use more compact styling to fit everything
        const severity = point.Injury || point['Accident Classification'] || 'Minimal';
        const severityColor = {
            'Fatal': '#e23725',
            'Major': '#ff7f00',
            'Minor': '#ffd700',
            'Minimal': '#6c757d',
            'None': '#6c757d'
        }[severity] || '#6c757d';

        return `
    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #667eea;">${point.Year || 'N/A'}</div>
                <div style="font-size: 11px; color: #666;">Year</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: ${severityColor};">${severity}</div>
                <div style="font-size: 11px; color: #666;">Severity</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
            <div>
                <div style="font-weight: bold; color: #333;">Time:</div>
                <div style="color: #666;">${point['Time of Collision'] || 'Unknown'}</div>
            </div>
            <div>
                <div style="font-weight: bold; color: #333;">Road Class:</div>
                <div style="color: #666;">${point.ROAD_CLASS || 'Unknown'}</div>
            </div>
            <div>
                <div style="font-weight: bold; color: #333;">Visibility:</div>
                <div style="color: #666;">${point.VISIBILITY || 'Unknown'}</div>
            </div>
            <div>
                <div style="font-weight: bold; color: #333;">Lighting:</div>
                <div style="color: #666;">${point.LIGHT || 'Unknown'}</div>
            </div>
        </div>
        
        <div style="margin-top: 10px; font-size: 11px; color: #666;">
            <div><strong>Location:</strong> ${point.STREET1 || 'Unknown'}${point.STREET2 ? ` & ${point.STREET2}` : ''}</div>
            <div>${point['Toronto Neighbourhood Name'] || 'Unknown'}</div>
        </div>
    </div>
    `;
    }

    extractIndividualActionAnalysis(data) {
        let vis = this;
        const point = data.originalData;

        const actions = [];
        const actionDetails = [];

        if (point['Apparent Driver Action'] && point['Apparent Driver Action'] !== '' && point['Apparent Driver Action'] !== 'Unknown') {
            const driverAction = point['Apparent Driver Action'];
            actions.push(`<span style="color: ${vis.actionTypeColors.Driver};">Driver: ${driverAction}</span>`);
            actionDetails.push({
                type: 'Driver',
                action: driverAction,
                color: vis.actionTypeColors.Driver
            });
        }

        if (point['Pedestrian Action'] && point['Pedestrian Action'] !== '' && point['Pedestrian Action'] !== 'Unknown') {
            const pedestrianAction = point['Pedestrian Action'];
            actions.push(`<span style="color: ${vis.actionTypeColors.Pedestrian};">Pedestrian: ${pedestrianAction}</span>`);
            actionDetails.push({
                type: 'Pedestrian',
                action: pedestrianAction,
                color: vis.actionTypeColors.Pedestrian
            });
        }

        if (point['Cyclist Action'] && point['Cyclist Action'] !== '' && point['Cyclist Action'] !== 'Unknown') {
            const cyclistAction = point['Cyclist Action'];
            actions.push(`<span style="color: ${vis.actionTypeColors.Cyclist};">Cyclist: ${cyclistAction}</span>`);
            actionDetails.push({
                type: 'Cyclist',
                action: cyclistAction,
                color: vis.actionTypeColors.Cyclist
            });
        }

        // Get contributing factors and conditions
        const driverCondition = point['Driver Condition'] || 'Normal';
        const pedestrianCondition = point['Pedestrian Condition'] || 'Normal';
        const cyclistCondition = point['Cyclist Condition'] || 'Normal';

        // Get vehicle maneuver if available
        const vehicleManeuver = point['Vehicle Manoeuver'] || 'Unknown';

        // Get additional context
        const personInvolved = point['Person Involved'] || 'Unknown';
        const vehicleType = point['Vehicle Type'] || 'Unknown';

        return `
    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; max-height: 400px; overflow-y: auto;">
        <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px; font-size: 16px;">Primary Action Type:</div>
            <div style="color: ${data.color}; font-weight: bold; font-size: 18px; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid ${data.color};">
                ${data.actionType}
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px; font-size: 16px;">Specific Actions Identified:</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${actions.length > 0 ?
            actions.map(action => `
                            <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid ${actionDetails.find(a => action.includes(a.type))?.color || '#666'};">
                                <div style="font-size: 14px; font-weight: bold;">
                                    ${action}
                                </div>
                            </div>
                        `).join('') :
            '<div style="color: #666; font-style: italic; font-size: 14px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 6px;">No specific action data recorded for this accident</div>'
        }
            </div>
        </div>
        
        <div style="margin-top: 15px;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px; font-size: 16px;">Additional Context:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                ${personInvolved !== 'Unknown' ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <span style="color: #666;">Person Involved:</span>
                        <span style="font-weight: bold; color: #333;">${personInvolved}</span>
                    </div>
                ` : ''}
                
                ${vehicleType !== 'Unknown' ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <span style="color: #666;">Vehicle Type:</span>
                        <span style="font-weight: bold; color: #333;">${vehicleType}</span>
                    </div>
                ` : ''}
                
                ${vehicleManeuver !== 'Unknown' ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <span style="color: #666;">Vehicle Maneuver:</span>
                        <span style="font-weight: bold; color: #333;">${vehicleManeuver}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px; font-size: 16px;">Contributing Conditions:</div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
                ${driverCondition !== 'Normal' ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: ${driverCondition !== 'Normal' ? '#ffe8e8' : '#f8f9fa'}; border-radius: 4px;">
                        <span style="color: #666;">Driver Condition:</span>
                        <span style="font-weight: bold; color: ${driverCondition !== 'Normal' ? '#e23725' : '#333'};">${driverCondition}</span>
                    </div>
                ` : ''}
                
                ${pedestrianCondition !== 'Normal' ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: ${pedestrianCondition !== 'Normal' ? '#ffe8e8' : '#f8f9fa'}; border-radius: 4px;">
                        <span style="color: #666;">Pedestrian Condition:</span>
                        <span style="font-weight: bold; color: ${pedestrianCondition !== 'Normal' ? '#e23725' : '#333'};">${pedestrianCondition}</span>
                    </div>
                ` : ''}
                
                ${cyclistCondition !== 'Normal' ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: ${cyclistCondition !== 'Normal' ? '#ffe8e8' : '#f8f9fa'}; border-radius: 4px;">
                        <span style="color: #666;">Cyclist Condition:</span>
                        <span style="font-weight: bold; color: ${cyclistCondition !== 'Normal' ? '#e23725' : '#333'};">${cyclistCondition}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px; font-size: 16px;">Action Pattern Analysis:</div>
            <div style="font-size: 14px; color: #666; line-height: 1.5; background: #f8f9fa; padding: 12px; border-radius: 6px;">
                ${actions.length > 0 ?
            `This ${data.actionType.toLowerCase()}-related accident involved ${actionDetails.length} distinct action${actionDetails.length !== 1 ? 's' : ''}. ` +
            (actionDetails.length > 0 ? `The primary action was "${actionDetails[0].action}". ` : '') +
            `Understanding these specific actions helps identify targeted safety interventions.` :
            `This accident involved a ${personInvolved.toLowerCase()} but no specific actions were recorded. ` +
            `The collision occurred under ${point.LIGHT ? point.LIGHT.toLowerCase() : 'unknown'} conditions with ${point['Road Surface Condition'] ? point['Road Surface Condition'].toLowerCase() : 'unknown'} road surface.`
        }
            </div>
        </div>
    </div>
    `;
    }

    createClickInstruction() {
        let vis = this;
        vis.clickInstruction = vis.svg.append("text")
            .attr("class", "click-instruction")
            .attr("x", vis.width / 2)
            .attr("y", vis.height - 25)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#666")
            .style("pointer-events", "none")
            .style("text-shadow", "0px 0px 4px white, 0px 0px 4px white, 0px 0px 4px white") // White background for readability
            .text("💡 Click on the circles to view detailed accident information");
    }
}