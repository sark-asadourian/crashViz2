class ActionHotspotVis {

    constructor(parentElement, crashData, geoData, solutionsData = null, mainMapProjection = null) {
        let vis = this;
        vis.parentElement = parentElement;
        vis.crashData = crashData;
        vis.geoData = geoData;
        vis.selectedActionType = 'All';
        vis.selectedAction = 'All';
        vis.selectedYear = 2006;
        vis.displayMode = 'cluster';
        vis.isEmptyMapMode = false;
        vis.showImprovements = false;
        vis.solutionsData = solutionsData || [];

        vis.mainMapProjection = mainMapProjection;

        vis.createBackButton();
        vis.improvementSuggestions = new ImprovementSuggestions(crashData, solutionsData);

        // Define colors for each action type
        vis.actionTypeColors = {
            'Driver': '#7e96f6',
            'Pedestrian': '#984040',
            'Cyclist': '#23c350'
        };

        vis.neighborhoods = [
            {name: "Downtown Toronto", lat: 43.6537, lng: -79.3819},
            {name: "Etobicoke", lat: 43.6439, lng: -79.5643},
            {name: "North York", lat: 43.7722, lng: -79.4140},
            {name: "East York", lat: 43.6922, lng: -79.3291},
            {name: "York", lat: 43.6904, lng: -79.4786},
            {name: "Scarborough", lat: 43.7728, lng: -79.2582}
        ];

        vis.precomputeData();
        vis.initVis();
        vis.wrangleData();
    }

    precomputeData() {
        let vis = this;

        let driverActions = {};
        let pedestrianActions = {};
        let cyclistActions = {};
        const yearSet = new Set();

        vis.precomputedData = vis.crashData.map(d => {
            const lat = parseFloat(d.LATITUDE);
            const lng = parseFloat(d.LONGITUDE);
            const year = +d.Year || +d['Year of collision'] || 0;

            if (year >= 2006 && year <= 2023) {
                yearSet.add(year);
            }

            const driverAction = (d['Apparent Driver Action'] || '').trim();
            const pedestrianAction = (d['Pedestrian Action'] || '').trim();
            const cyclistAction = (d['Cyclist Action'] || '').trim();

            const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat > 0 && lng < 0;

            // Determine action type
            let actionType = 'Driver';
            if (pedestrianAction && pedestrianAction !== '' && pedestrianAction !== 'Unknown') {
                actionType = 'Pedestrian';
            } else if (cyclistAction && cyclistAction !== '' && cyclistAction !== 'Unknown') {
                actionType = 'Cyclist';
            }

            // Count actions for top actions extraction
            if (driverAction && driverAction !== '' && driverAction !== 'Unknown') {
                driverActions[driverAction] = (driverActions[driverAction] || 0) + 1;
            }
            if (pedestrianAction && pedestrianAction !== '' && pedestrianAction !== 'Unknown') {
                pedestrianActions[pedestrianAction] = (pedestrianActions[pedestrianAction] || 0) + 1;
            }
            if (cyclistAction && cyclistAction !== '' && cyclistAction !== 'Unknown') {
                cyclistActions[cyclistAction] = (cyclistActions[cyclistAction] || 0) + 1;
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

        vis.availableYears = Array.from(yearSet)
            .filter(year => year >= 2006 && year <= 2023)
            .sort((a, b) => a - b);

        // Get top 5 actions for each category
        vis.driverActions = this.getTopActions(driverActions);
        vis.pedestrianActions = this.getTopActions(pedestrianActions);
        vis.cyclistActions = this.getTopActions(cyclistActions);

        vis.allActions = [
            ...vis.driverActions.map(action => `Driver: ${action}`),
            ...vis.pedestrianActions.map(action => `Pedestrian: ${action}`),
            ...vis.cyclistActions.map(action => `Cyclist: ${action}`)
        ];
    }

    getTopActions(actionsObj, limit = 5) {
        return Object.entries(actionsObj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([action]) => action);
    }

    initVis() {
        let vis = this;

        // Clear any existing content
        const parent = d3.select("#" + vis.parentElement);
        parent.html('');

        // Setup dimensions and SVG
        vis.setupSVG(parent);

        // Setup map projection and elements
        vis.setupMapProjection();
        vis.drawMapElements();

        // Setup interactions
        vis.setupInteractions();

        // Create UI controls
        vis.createControls();
        vis.createTooltip();
        vis.createYearDisplay();
        vis.createClickInstruction();

        vis.wrangleData();
    }

    setupSVG(parent) {
        let vis = this;

        vis.margin = {top: 0, right: 0, bottom: 0, left: 0};
        vis.width = 829 - vis.margin.left - vis.margin.right;
        vis.height = 609.88 - vis.margin.top - vis.margin.bottom;

        vis.svg = parent
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
    }

    setupMapProjection() {
        let vis = this;

        // If we have the main map's projection, use it to maintain position
        if (vis.mainMapProjection) {
            vis.projection = vis.mainMapProjection;
            vis.initialScale = vis.projection.scale();
            vis.initialCenter = vis.projection.center();
        } else {
            // Calculate bounds from data (fallback)
            let validCoords = vis.precomputedData.filter(d => d.hasValidCoords);
            if (validCoords.length > 0) {
                vis.latMin = d3.min(validCoords, d => d.lat);
                vis.latMax = d3.max(validCoords, d => d.lat);
                vis.lngMin = d3.min(validCoords, d => d.lng);
                vis.lngMax = d3.max(validCoords, d => d.lng);

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

            let centerLng = (vis.lngMin + vis.lngMax) / 2;
            let centerLat = (vis.latMin + vis.latMax) / 2;

            vis.projection = d3.geoMercator()
                .center([centerLng, centerLat])
                .scale(vis.width * 100)
                .translate([vis.width / 2, vis.height / 2]);

            // Store initial projection parameters
            vis.initialScale = vis.projection.scale();
            vis.initialCenter = vis.projection.center();
        }

        vis.path = d3.geoPath().projection(vis.projection);
    }
    drawMapElements() {
        let vis = this;

        // Draw map background
        vis.mapBackground = vis.svg.append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("fill", "#ffffff")
            .attr("rx", 12);

        // Draw GeoJSON if available
        if (vis.geoData && vis.geoData.features) {
            vis.svg.selectAll(".road")
                .data(vis.geoData.features)
                .enter()
                .append("path")
                .attr("class", "road")
                .attr("d", vis.path)
                .attr("fill", "none")
                .attr("stroke", "#a7a7a7")
                .attr("stroke-width", 0.3);
        }

        // Draw neighborhood labels
        vis.drawNeighborhoodLabels();
    }

    drawNeighborhoodLabels() {
        let vis = this;

        vis.neighborhoodLabels = vis.svg.selectAll(".neighborhood-label")
            .data(vis.neighborhoods)
            .enter()
            .append("text")
            .attr("class", "neighborhood-label")
            .attr("x", d => vis.projection([d.lng, d.lat])[0])
            .attr("y", d => vis.projection([d.lng, d.lat])[1])
            .attr("text-anchor", "middle")
            .attr("dy", "-0.5em")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#333")
            .attr("stroke", "white")
            .attr("stroke-width", "0.3px")
            .attr("paint-order", "stroke")
            .text(d => d.name);
    }

    setupInteractions() {
        let vis = this;

        vis.updateMapElements = function () {
            vis.path = d3.geoPath().projection(vis.projection);

            // Update roads
            vis.svg.selectAll(".road").attr("d", vis.path);

            // Update action points
            let actionPoints = vis.svg.selectAll(".action-point");
            if (!actionPoints.empty()) {
                actionPoints
                    .attr("cx", d => {
                        if (d && d.lng !== undefined && d.lat !== undefined) {
                            let coords = vis.projection([d.lng, d.lat]);
                            return coords ? coords[0] : 0;
                        }
                        return 0;
                    })
                    .attr("cy", d => {
                        if (d && d.lng !== undefined && d.lat !== undefined) {
                            let coords = vis.projection([d.lng, d.lat]);
                            return coords ? coords[1] : 0;
                        }
                        return 0;
                    });
            }

            // Update neighborhood labels
            vis.updateNeighborhoodLabels();
        };

        // Set up zoom behavior
        let initialCenter, startPoint, isDragging = false;

        vis.zoom = d3.zoom()
            .scaleExtent([0.5, 10])
            .on("start", function (event) {
                if (event.sourceEvent && event.sourceEvent.type === "mousedown") {
                    isDragging = true;
                    initialCenter = vis.projection.center();
                    startPoint = vis.projection.invert([event.sourceEvent.x, event.sourceEvent.y]);
                } else {
                    isDragging = false;
                }
            })
            .on("zoom", function (event) {
                vis.projection.scale(event.transform.k * vis.initialScale);

                if (isDragging && event.sourceEvent && startPoint) {
                    let currentPoint = vis.projection.invert([event.sourceEvent.x, event.sourceEvent.y]);
                    if (currentPoint) {
                        let deltaLng = startPoint[0] - currentPoint[0];
                        let deltaLat = startPoint[1] - currentPoint[1];

                        vis.projection.center([
                            initialCenter[0] + deltaLng,
                            initialCenter[1] + deltaLat
                        ]);
                    }
                }

                vis.updateMapElements();
            })
            .on("end", function () {
                isDragging = false;
            });

        vis.svg.call(vis.zoom);
    }

    updateNeighborhoodLabels() {
        let vis = this;

        let labels = vis.svg.selectAll(".neighborhood-label");
        if (!labels.empty()) {
            let currentScale = vis.projection.scale();
            let scaleFactor = currentScale / vis.initialScale;
            let fontSize = Math.max(10, Math.min(16, 12 * scaleFactor));

            labels
                .attr("x", d => {
                    if (d && d.lng !== undefined && d.lat !== undefined) {
                        let coords = vis.projection([d.lng, d.lat]);
                        return coords ? coords[0] : 0;
                    }
                    return 0;
                })
                .attr("y", d => {
                    if (d && d.lng !== undefined && d.lat !== undefined) {
                        let coords = vis.projection([d.lng, d.lat]);
                        return coords ? coords[1] : 0;
                    }
                    return 0;
                })
                .attr("font-size", fontSize + "px");

            // Move labels to the front
            labels.each(function () {
                this.parentNode.appendChild(this);
            });
        }
    }

    createControls() {
        let vis = this;

        // Remove any existing options panel
        d3.select("#options-panel").remove();

        // Create side panel container
        vis.sidePanel = d3.select("body")
            .append("div")
            .attr("id", "options-panel")
            .style("position", "absolute")
            .style("top", "20px")
            .style("right", "20px")
            .style("width", "300px")
            .style("background", "rgba(255, 255, 255, 0.98)")
            .style("border", "1px solid #ccc")
            .style("border-radius", "8px")
            .style("padding", "20px")
            .style("z-index", "1000")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
            .style("font-family", "Overpass, sans-serif");

        // Build panel sections
        vis.createPanelHeader();
        vis.createCurrentSettings();
        vis.createControlElements();
    }

    createPanelHeader() {
        let vis = this;

        const header = vis.sidePanel.append("div")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("align-items", "center")
            .style("margin-bottom", "20px")
            .style("padding-bottom", "15px")
            .style("border-bottom", "2px solid #007bff")
            .style("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .style("margin", "-20px -20px 20px -20px")
            .style("padding", "20px")
            .style("border-radius", "8px 8px 0 0");

        header.append("h3")
            .text("🚦 Action Analysis Mode")
            .style("margin", "0")
            .style("color", "white")
            .style("font-size", "18px")
            .style("font-weight", "bold");
    }

    createCurrentSettings() {
        let vis = this;

        vis.sidePanel.append("div")
            .attr("class", "current-settings")
            .style("background", "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)")
            .style("padding", "15px")
            .style("border-radius", "8px")
            .style("margin-bottom", "20px")
            .style("border", "none")
            .style("font-size", "13px")
            .style("color", "white")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.1)")
            .html(this.getCurrentSettingsHTML());
    }

    getCurrentSettingsHTML() {
        let vis = this;
        return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><strong>Year:</strong><br>${vis.selectedYear}</div>
            <div><strong>Mode:</strong><br>${vis.displayMode}</div>
            <div><strong>Type:</strong><br>${vis.selectedActionType}</div>
            <div><strong>Action:</strong><br>${vis.selectedAction === 'All' ? 'All Actions' : vis.selectedAction}</div>
        </div>
    `;
    }

    createControlElements() {
        let vis = this;

        const controlsContainer = vis.sidePanel.append("div")
            .attr("class", "controls-container")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "20px");

        // Display mode selector
        vis.createSelectControl(controlsContainer,
            "Display Mode",
            "displayModeSelect",
            ['cluster', 'individual'],
            ['Show Clusters', 'Show Individual Accidents'],
            'cluster',
            value => {
                vis.displayMode = value;
                vis.updateCurrentSettings();
                vis.wrangleData();
            }
        );

        // Action type selector
        vis.createSelectControl(controlsContainer,
            "Action Type",
            "actionTypeSelect",
            ['All', 'Driver', 'Pedestrian', 'Cyclist'],
            ['All Actions', 'Driver Actions', 'Pedestrian Actions', 'Cyclist Actions'],
            'All',
            value => {
                vis.selectedActionType = value;
                vis.updateActionOptions();
                vis.updateCurrentSettings();
                vis.wrangleData();
            }
        );

        // Specific action selector
        vis.createSelectControl(controlsContainer,
            "Specific Action",
            "actionSelect",
            ['All'],
            ['All Actions'],
            'All',
            value => {
                vis.selectedAction = value;
                vis.updateCurrentSettings();
                vis.wrangleData();
            }
        );

        // Initialize action options
        vis.updateActionOptions();

        // Add legend
        vis.createLegend(controlsContainer);
    }

    createSelectControl(container, label, propertyName, values, displayTexts, defaultValue, onChange) {
        let vis = this;

        const group = container.append("div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "8px");

        group.append("label")
            .text(label)
            .style("font-weight", "bold")
            .style("margin-bottom", "4px")
            .style("font-size", "14px")
            .style("color", "#333");

        const select = group.append("select")
            .style("width", "100%")
            .style("padding", "10px 12px")
            .style("border", "2px solid #e1e5e9")
            .style("border-radius", "6px")
            .style("font-size", "14px")
            .style("background", "#fff")
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .on("change", function () {
                onChange(this.value);
            })
            .on("mouseover", function() {
                d3.select(this).style("border-color", "#667eea");
            })
            .on("mouseout", function() {
                d3.select(this).style("border-color", "#e1e5e9");
            });

        // Add options
        select.selectAll("option")
            .data(values)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text((d, i) => displayTexts[i] || d)
            .property("selected", d => d === defaultValue);

        // Store reference
        vis[propertyName] = select;
    }
    updateActionOptions() {
        let vis = this;

        let actions = ['All'];
        let displayTexts = ['All Actions'];

        if (vis.selectedActionType === 'All') {
            actions = ['All', ...vis.allActions];
            displayTexts = ['All Actions', ...vis.allActions];
        } else if (vis.selectedActionType === 'Driver') {
            actions = ['All', ...vis.driverActions];
            displayTexts = ['All Actions', ...vis.driverActions];
        } else if (vis.selectedActionType === 'Pedestrian') {
            actions = ['All', ...vis.pedestrianActions];
            displayTexts = ['All Actions', ...vis.pedestrianActions];
        } else if (vis.selectedActionType === 'Cyclist') {
            actions = ['All', ...vis.cyclistActions];
            displayTexts = ['All Actions', ...vis.cyclistActions];
        }

        // Update the action select dropdown
        if (vis.actionSelect) {
            vis.actionSelect.selectAll("option").remove();

            vis.actionSelect.selectAll("option")
                .data(actions)
                .enter()
                .append("option")
                .attr("value", d => d)
                .text((d, i) => displayTexts[i])
                .property("selected", d => d === 'All');
        }

        vis.selectedAction = 'All';
    }

    updateCurrentSettings() {
        let vis = this;
        const settingsDiv = vis.sidePanel.select(".current-settings");
        if (!settingsDiv.empty()) {
            settingsDiv.html(this.getCurrentSettingsHTML());
        }
    }

    createLegend(parentElement) {
        let vis = this;

        const legendContainer = parentElement.append("div")
            .style("margin-top", "10px")
            .style("padding-top", "15px")
            .style("border-top", "1px solid #eee");

        legendContainer.append("div")
            .style("font-weight", "bold")
            .style("margin-bottom", "10px")
            .style("font-size", "14px")
            .style("color", "#333")
            .text("Action Types:");

        const legendItems = legendContainer.selectAll(".legend-item")
            .data([
                {type: "Driver", color: vis.actionTypeColors.Driver},
                {type: "Pedestrian", color: vis.actionTypeColors.Pedestrian},
                {type: "Cyclist", color: vis.actionTypeColors.Cyclist}
            ])
            .enter()
            .append("div")
            .attr("class", "legend-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "8px")
            .style("margin-bottom", "5px");

        legendItems.append("div")
            .style("width", "16px")
            .style("height", "16px")
            .style("background", d => d.color)
            .style("border", "1px solid #666")
            .style("border-radius", "3px");

        legendItems.append("div")
            .style("font-size", "13px")
            .style("font-weight", "bold")
            .style("color", "#333")
            .text(d => d.type);
    }

    createTooltip() {
        let vis = this;

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
            .style("pointer-events", "none")
            .text(`Year: ${vis.selectedYear}`);
    }

    createClickInstruction() {
        let vis = this;

        vis.clickInstruction = vis.svg.append("text")
            .attr("class", "click-instruction")
            .attr("x", vis.width / 2)
            .attr("y", vis.height - 25)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#666")
            .style("pointer-events", "none")
            .style("text-shadow", "0px 0px 4px white, 0px 0px 4px white, 0px 0px 4px white")
            .text("💡 Click on the circles to view detailed action information");
    }

    wrangleData() {
        let vis = this;

        if (vis.isEmptyMapMode) return;

        vis.filteredData = vis.precomputedData.filter(d => {
            if (!d.hasValidCoords) return false;
            if (d.year !== vis.selectedYear) return false;

            return this.filterByActionType(d);
        });

        if (vis.displayMode === 'individual') {
            vis.prepareIndividualData();
        } else {
            vis.prepareClusterData();
        }

        vis.updateVis();
    }

    filterByActionType(d) {
        let vis = this;

        if (vis.selectedActionType === 'All') {
            if (vis.selectedAction === 'All') {
                return d.hasDriverAction || d.hasPedestrianAction || d.hasCyclistAction;
            } else {
                let actionType = vis.selectedAction.split(': ')[0];
                let actionValue = vis.selectedAction.split(': ')[1];
                return this.matchAction(d, actionType, actionValue);
            }
        } else if (vis.selectedActionType === 'Driver') {
            return vis.selectedAction === 'All' ? d.hasDriverAction : d.driverAction === vis.selectedAction;
        } else if (vis.selectedActionType === 'Pedestrian') {
            return vis.selectedAction === 'All' ? d.hasPedestrianAction : d.pedestrianAction === vis.selectedAction;
        } else if (vis.selectedActionType === 'Cyclist') {
            return vis.selectedAction === 'All' ? d.hasCyclistAction : d.cyclistAction === vis.selectedAction;
        }
        return false;
    }

    matchAction(d, actionType, actionValue) {
        if (actionType === 'Driver') {
            return d.driverAction === actionValue;
        } else if (actionType === 'Pedestrian') {
            return d.pedestrianAction === actionValue;
        } else if (actionType === 'Cyclist') {
            return d.cyclistAction === actionValue;
        }
        return false;
    }

    prepareIndividualData() {
        let vis = this;

        vis.individualData = vis.filteredData.map(d => {
            const projectedCoords = vis.projection([d.lng, d.lat]);
            return {
                lat: d.lat,
                lng: d.lng,
                x: projectedCoords[0],
                y: projectedCoords[1],
                actionType: d.actionType,
                color: d.color,
                originalData: d.originalData
            };
        });
    }

    prepareClusterData() {
        let vis = this;

        const gridSize = 0.005;
        const clustersMap = new Map();

        vis.filteredData.forEach(d => {
            const gridKey = `${Math.floor(d.lat / gridSize)}_${Math.floor(d.lng / gridSize)}`;

            if (!clustersMap.has(gridKey)) {
                clustersMap.set(gridKey, this.createNewCluster(d));
            } else {
                this.updateCluster(clustersMap.get(gridKey), d);
            }
        });

        vis.clusterData = Array.from(clustersMap.values()).map(cluster =>
            this.processCluster(cluster, vis)
        );
    }

    createNewCluster(d) {
        return {
            centerLat: d.lat,
            centerLng: d.lng,
            points: [d.originalData],
            count: 1,
            actionCounts: {},
            actionTypeCounts: {Driver: 0, Pedestrian: 0, Cyclist: 0},
            locations: {},
            streets: {},
            districts: {}
        };
    }

    updateCluster(cluster, d) {
        cluster.points.push(d.originalData);
        cluster.count++;

        // Update center using running average
        cluster.centerLat = (cluster.centerLat * (cluster.count - 1) + d.lat) / cluster.count;
        cluster.centerLng = (cluster.centerLng * (cluster.count - 1) + d.lng) / cluster.count;

        // Update action counts
        this.updateActionCounts(cluster, d);
        this.updateLocationInfo(cluster, d);
    }

    updateActionCounts(cluster, d) {
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
    }

    updateLocationInfo(cluster, d) {
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
    }

    processCluster(cluster, vis) {
        const topAction = this.findTopAction(cluster.actionCounts);
        const dominantType = this.findDominantType(cluster.actionTypeCounts);
        const projectedCoords = vis.projection([cluster.centerLng, cluster.centerLat]);

        const mostCommonLocation = this.findMostCommon(cluster.locations, 'Various Locations');
        const mostCommonStreet = this.findMostCommon(cluster.streets, 'Various Streets');
        const mostCommonDistrict = this.findMostCommon(cluster.districts, 'Various Districts');

        return {
            lat: cluster.centerLat,
            lng: cluster.centerLng,
            x: projectedCoords[0],
            y: projectedCoords[1],
            count: cluster.count,
            topAction: topAction,
            actionCounts: cluster.actionCounts,
            actionTypeCounts: cluster.actionTypeCounts,
            dominantType: dominantType,
            color: vis.actionTypeColors[dominantType],
            points: cluster.points,
            mostCommonLocation: mostCommonLocation,
            mostCommonStreet: mostCommonStreet,
            mostCommonDistrict: mostCommonDistrict,
            locations: cluster.locations,
            streets: cluster.streets,
            districts: cluster.districts
        };
    }

    findTopAction(actionCounts) {
        let topAction = 'No Action Data';
        let maxCount = 0;
        for (let action in actionCounts) {
            if (actionCounts[action] > maxCount) {
                maxCount = actionCounts[action];
                topAction = action;
            }
        }
        return topAction;
    }

    findDominantType(actionTypeCounts) {
        const {Driver = 0, Pedestrian = 0, Cyclist = 0} = actionTypeCounts;

        if (Pedestrian >= Driver && Pedestrian >= Cyclist) return 'Pedestrian';
        if (Cyclist >= Driver && Cyclist >= Pedestrian) return 'Cyclist';
        return 'Driver';
    }

    findMostCommon(obj, defaultValue) {
        const entries = Object.entries(obj);
        return entries.length > 0 ?
            entries.sort((a, b) => b[1] - a[1])[0][0] :
            defaultValue;
    }

    updateVis() {
        let vis = this;

        if (vis.isEmptyMapMode) return;

        // Update year display
        if (vis.yearDisplay) {
            vis.yearDisplay.text(`Year: ${vis.selectedYear}`);
        }

        // Clear existing points
        vis.svg.selectAll(".action-cluster, .action-point").remove();

        if (vis.displayMode === 'individual') {
            vis.showIndividualPoints();
        } else {
            vis.showClusters();
        }

        // Ensure neighborhood labels stay on top
        vis.svg.selectAll(".neighborhood-label")
            .each(function () {
                this.parentNode.appendChild(this);
            });

        // Update title
        vis.updateTitle();
    }

    updateTitle() {
        let vis = this;

        const titleText = `${vis.selectedActionType} Action ${vis.displayMode === 'individual' ? 'Points' : 'Hotspots'} (${vis.selectedYear}): ${vis.selectedAction === 'All' ? 'All Actions' : vis.selectedAction}`;

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
            .text(titleText);
    }

    showIndividualPoints() {
        let vis = this;

        vis.individualPoints = vis.svg.selectAll(".action-point")
            .data(vis.individualData, d => d.lat + '_' + d.lng)
            .enter()
            .append("circle")
            .attr("class", "action-point")
            .attr("cx", d => vis.projection([d.lng, d.lat])[0])
            .attr("cy", d => vis.projection([d.lng, d.lat])[1])
            .attr("r", 3)
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("opacity", 0.7)
            .on("mouseover", function (event, d) {
                vis.showIndividualTooltip(event, d);
            })
            .on("mouseout", () => vis.hideTooltip())
            .on("click", function (event, d) {
                event.stopPropagation();
                vis.handlePointClick(this, d);
            });
    }

    showClusters() {
        let vis = this;

        vis.sizeScale = d3.scaleSqrt()
            .domain([1, d3.max(vis.clusterData, d => d.count)])
            .range([5, 25]);

        vis.clusters = vis.svg.selectAll(".action-cluster")
            .data(vis.clusterData)
            .enter()
            .append("circle")
            .attr("class", "action-cluster")
            .attr("cx", d => vis.projection([d.lng, d.lat])[0])
            .attr("cy", d => vis.projection([d.lng, d.lat])[1])
            .attr("r", d => vis.sizeScale(d.count))
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.8)
            .on("mouseover", function (event, d) {
                vis.showClusterTooltip(event, d);
            })
            .on("mouseout", () => vis.hideTooltip())
            .on("click", function (event, d) {
                event.stopPropagation();
                vis.handleClusterClick(this, d);
            });
    }

    handlePointClick(element, d) {
        let vis = this;

        vis.hideSolutionGist();
        vis.showDetailedView(d);

        // Highlight the clicked point
        vis.svg.selectAll(".action-point")
            .attr("stroke-width", 1)
            .attr("opacity", 0.7);
        d3.select(element)
            .attr("stroke-width", 2)
            .attr("opacity", 1);
    }

    handleClusterClick(element, d) {
        let vis = this;

        vis.hideSolutionGist();
        vis.showDetailedView(d);

        // Highlight the clicked cluster
        vis.svg.selectAll(".action-cluster")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.8);
        d3.select(element)
            .attr("stroke-width", 3)
            .attr("opacity", 1);
    }

    showIndividualTooltip(event, d) {
        let vis = this;

        const actionDetails = this.getActionDetails(d.originalData);

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

        const actionList = this.getTopActionsList(d.actionCounts, 5);
        const typeBreakdown = this.getTypeBreakdown(d.actionTypeCounts, vis);

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

    getActionDetails(originalData) {
        const actions = [];

        const driverAction = (originalData['Apparent Driver Action'] || '').trim();
        const pedestrianAction = (originalData['Pedestrian Action'] || '').trim();
        const cyclistAction = (originalData['Cyclist Action'] || '').trim();

        if (driverAction && driverAction !== '' && driverAction !== 'Unknown') {
            actions.push(`Driver: ${driverAction}`);
        }
        if (pedestrianAction && pedestrianAction !== '' && pedestrianAction !== 'Unknown') {
            actions.push(`Pedestrian: ${pedestrianAction}`);
        }
        if (cyclistAction && cyclistAction !== '' && cyclistAction !== 'Unknown') {
            actions.push(`Cyclist: ${cyclistAction}`);
        }

        return actions;
    }

    getTopActionsList(actionCounts, limit) {
        return Object.entries(actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([action, count]) => `${action}: ${count}`)
            .join('<br>');
    }

    getTypeBreakdown(actionTypeCounts, vis) {
        return Object.entries(actionTypeCounts)
            .filter(([type, count]) => count > 0)
            .map(([type, count]) => {
                let color = vis.actionTypeColors[type];
                return `<span style="color: ${color}; font-weight: bold;">${type}: ${count}</span>`;
            })
            .join('<br>');
    }

    hideTooltip() {
        let vis = this;
        vis.tooltip.style("opacity", 0);
    }

    setYear(year) {
        let vis = this;

        if (year < 2006 || year > 2023) return;

        if (vis.selectedYear !== year) {
            vis.selectedYear = year;

            if (vis.yearDisplay) {
                vis.yearDisplay.text(`Year: ${vis.selectedYear}`);
            }

            vis.updateCurrentSettings();

            if (!vis.isEmptyMapMode) {
                vis.wrangleData();
            }
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

    createBackButton() {
        let vis = this;

        // Remove any existing back button from anywhere on the page
        d3.selectAll(".back-to-map-btn").remove();

        // Create the back button - append to body instead of parent element
        vis.backButton = d3.select("body")
            .append("button")
            .attr("class", "back-to-map-btn")
            .html("← Back to Regular Map")
            .style("position", "fixed") // Use fixed instead of absolute
            .style("top", "20px")
            .style("left", "20px") // Position on left side to avoid panel
            .style("z-index", "1001")
            .style("padding", "12px 20px")
            .style("background", "linear-gradient(135deg, #667eea, #764ba2)")
            .style("color", "white")
            .style("border", "none")
            .style("border-radius", "8px")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
            .style("transition", "all 0.3s ease")
            .style("font-family", "Overpass, sans-serif")
            .on("mouseover", function() {
                d3.select(this)
                    .style("transform", "translateY(-2px)")
                    .style("box-shadow", "0 6px 16px rgba(0,0,0,0.2)");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("transform", "translateY(0)")
                    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)");
            })
            .on("click", function() {
                vis.switchToMainMap();
            });

        console.log('Back button created successfully');
    }

    switchToMainMap() {
        let vis = this;
        console.log('Switching back to main map');

        // Debug: Check what's available
        console.log('Available data:', {
            crashData: !!window.crashData,
            geoData: !!window.geoData,
            myMapVis: !!window.myMapVis,
            parentElement: vis.parentElement
        });

        // Completely remove everything from the container
        d3.select("#" + vis.parentElement).html('');

        // Remove the side panel
        d3.select("#options-panel").remove();

        // Remove the back button
        d3.selectAll(".back-to-map-btn").remove();

        // Try to recreate the main map
        if (window.myMapVis && window.crashData && window.geoData) {
            console.log('Recreating main map using existing MapVis instance');

            // Reinitialize the main map
            window.myMapVis.initVis();

            // Make sure the action analysis button is visible
            window.myMapVis.createActionAnalysisButton();

            // Update to current timeline year
            if (window.myTimelineVis) {
                const currentYear = window.myTimelineVis.selectedYear;
                window.myMapVis.setYear(currentYear);
            }
        } else if (window.crashData && window.geoData) {
            console.log('Creating new MapVis instance');
            // Create a new MapVis instance
            window.myMapVis = new MapVis(vis.parentElement, window.crashData, window.geoData);

            // Reconnect timeline
            if (window.myTimelineVis) {
                window.myTimelineVis.onYearChange = function(year) {
                    console.log('Timeline -> MapVis:', year);
                    if (window.myMapVis) {
                        window.myMapVis.setYear(year);
                    }
                };

                // Update to current timeline year
                const currentYear = window.myTimelineVis.selectedYear;
                if (window.myMapVis) {
                    window.myMapVis.setYear(currentYear);
                }
            }
        } else {
            console.error('Cannot recreate main map: missing data');
            console.log('Available window properties:', Object.keys(window).filter(key =>
                key.includes('crash') || key.includes('geo') || key.includes('data') || key.includes('Map')
            ));

            // Fallback: reload the page
            console.log('Reloading page as fallback...');
            location.reload();
            return;
        }

        console.log('Successfully switched to main map');
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

        console.log('Finding solutions for:', {actionType, specificAction});

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

            return {solution, score};
        }).sort((a, b) => b.score - a.score)
            .map(item => item.solution);

        console.log(`Found ${scoredSolutions.length} relevant solutions for "${specificAction}"`);
        return scoredSolutions.slice(0, 3); // Return top 3 most relevant solutions
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
            .on("click", function (event) {
                event.stopPropagation();
                const solutionIndex = +this.getAttribute("data-solution-index");
                const solution = solutions[solutionIndex];
                console.log('Solution clicked:', solutionIndex, solution);
                vis.showSolutionDetails(solution, data);
            });

        modalContent.select(".close-detailed-view")
            .on("click", function () {
                vis.hideDetailedView();
            });

        modalContent.select(".view-full-solutions")
            .on("click", function () {
                vis.hideDetailedView();
                vis.toggleImprovementSuggestions();
            });

        vis.detailedView.on("click", function (event) {
            if (event.target === this) {
                vis.hideDetailedView();
            }
        });

        vis.escapeHandler = function (event) {
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
                .attr("stroke-width", function () {
                    return d3.select(this).classed("action-cluster") ? 2 : 1;
                })
                .attr("opacity", function () {
                    return d3.select(this).classed("action-cluster") ? 0.8 : 0.7;
                });
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
            .on("mouseover", function () {
                d3.select(this).style("border-color", "#4CAF50");
            })
            .on("mouseout", function () {
                d3.select(this).style("border-color", "#e0e0e0");
            })
            .on("click", function (event, d) {
                vis.showSuggestionDetails(d);
            });

        suggestionCards.each(function (d) {
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
            .on("click", function () {
                tooltip.remove();
                overlay.remove();
            });

        tooltip.select(".close-suggestion-btn")
            .on("click", function () {
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
            .on("click", function () {
                tooltip.remove();
                overlay.remove();
            });

        // Also close when pressing Escape key
        const escapeHandler = function (event) {
            if (event.key === "Escape") {
                tooltip.remove();
                overlay.remove();
                document.removeEventListener("keydown", escapeHandler);
            }
        };
        document.addEventListener("keydown", escapeHandler);

        // Clean up event listeners when tooltip is removed
        tooltip.on("remove", function () {
            overlay.remove();
            document.removeEventListener("keydown", escapeHandler);
        });
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
        </div>
    </div>
`);

        // Add event handlers
        modalContent.select(".close-solution-detail")
            .on("click", function () {
                solutionDetail.remove();
            });

        modalContent.select(".close-modal-btn")
            .on("click", function () {
                solutionDetail.remove();
            });

        // Close when clicking outside
        solutionDetail.on("click", function (event) {
            if (event.target === this) {
                solutionDetail.remove();
            }
        });

        // Close with Escape key
        const escapeHandler = function (event) {
            if (event.key === "Escape") {
                solutionDetail.remove();
                document.removeEventListener("keydown", escapeHandler);
            }
        };
        document.addEventListener("keydown", escapeHandler);

        // Clean up
        solutionDetail.on("remove", function () {
            document.removeEventListener("keydown", escapeHandler);
        });
    }

    // ADD THESE MISSING METHODS TO THE ActionHotspotVis CLASS:

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
               
      
                </div>
            </div>
        </div>
    </div>
</div>
`;
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

}