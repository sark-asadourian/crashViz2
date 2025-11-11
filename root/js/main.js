/* * * * * * * * * * * * * * * *
*           MAIN              *
* * * * * * * * * * * * * * */


const solutionData = [
    // Pedestrian Solutions
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Accessible pedestrian signals", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Road Infrastructure", "Road Safety Interventions": "Road Infrastructure, Technology" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Child pedestrian safety engineering", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users, General Population", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Policy, Road Infrastructure" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Child pedestrian safety strategies", "Type": "Road Users", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Environmental Factors", "Road Safety Interventions": "Education, Communication" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Crosswalk Design Improvements", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Road Infrastructure", "Road Safety Interventions": "Road Infrastructure, Technology" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Educate drivers on pedestrian visibility", "Type": "Road Users", "Risk Group(s)": "Vulnerable Road Users, General Population", "Contributing Factor(s)": "Speed, Environmental Factors", "Road Safety Interventions": "Education, Communication" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Leading pedestrian intervals", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Medians and pedestrian crossing islands", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Pedestrian countdown signals", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Pedestrian Hybrid Beacons", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure, Technology" },
    { "Primary Beneficiary": "Pedestrian", "Initiative Name": "School zone safety improvements", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Communication, Policy" },

    // Cyclist Solutions
    { "Primary Beneficiary": "Cyclist", "Initiative Name": "Advance stop lines for cyclists", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Cyclist", "Initiative Name": "Bicycle Box intersections", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Cyclist", "Initiative Name": "Grade Separated Cycle Paths", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Cyclist", "Initiative Name": "Separated Bicycle Lanes", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Cyclist", "Initiative Name": "Protected intersection design", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Cyclist", "Initiative Name": "Bike signal timing optimization", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Road Infrastructure", "Road Safety Interventions": "Road Infrastructure, Technology" },
    { "Primary Beneficiary": "Cyclist", "Initiative Name": "Bicycle safety education programs", "Type": "Road Users", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Environmental Factors", "Road Safety Interventions": "Education, Communication" },
    { "Primary Beneficiary": "Cyclist", "Initiative Name": "Driver education on cyclist awareness", "Type": "Road Users", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Environmental Factors", "Road Safety Interventions": "Education, Communication" },

    // Driver Solutions
    { "Primary Beneficiary": "Driver", "Initiative Name": "2+1 roads with median barriers", "Type": "Road Infrastructure", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Speed", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Automated speed enforcement", "Type": "Road Users", "Risk Group(s)": "High-risk Drivers, General Population", "Contributing Factor(s)": "Speed", "Road Safety Interventions": "Enforcement, Technology" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Autonomous Emergency Braking Systems", "Type": "Vehicles", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Distraction, Speed", "Road Safety Interventions": "Technology" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Driver distraction legislation", "Type": "Road Users", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Distraction", "Road Safety Interventions": "Policy" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Electronic stability control (ESC)", "Type": "Vehicles", "Risk Group(s)": "Young/Novice, High-risk, General", "Contributing Factor(s)": "Drugs, Alcohol, Distraction, Speed, Vehicle", "Road Safety Interventions": "Policy, Technology" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Enforcement of traffic laws", "Type": "Road Users", "Risk Group(s)": "High-risk Drivers", "Contributing Factor(s)": "Drugs, Alcohol, Distraction, Speed", "Road Safety Interventions": "Communication, Enforcement" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Graduated driver licensing (GDL)", "Type": "Road Users", "Risk Group(s)": "Young/Novice Drivers", "Contributing Factor(s)": "Drugs, Alcohol, Distraction, Speed", "Road Safety Interventions": "Policy" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Intersection safety improvements", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users, General Population", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Roundabouts", "Type": "Road Infrastructure", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Rumble Strips", "Type": "Road Infrastructure", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Distraction, Fatigue, Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
    { "Primary Beneficiary": "Driver", "Initiative Name": "Variable speed limits", "Type": "Road Infrastructure", "Risk Group(s)": "Commercial Drivers, General Population", "Contributing Factor(s)": "Speed, Environmental Factors", "Road Safety Interventions": "Technology" }
];


let myMapVis,
    myTimelineVis,
    myActionHotspotVis,
    isActionAnalysisMode = false,
    crashData, geoData, solutionsData;

let dataLoadStartTime;

let promises = [
    d3.csv("data/dataset.csv"),
    d3.json("data/Centreline - Version 2 - 4326.geojson"),
    d3.csv("data/solutions.csv")
];

d3.select("body").append("div")
    .attr("id", "loading-indicator")
    .style("position", "fixed")
    .style("top", "50%")
    .style("left", "50%")
    .style("transform", "translate(-50%, -50%)")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "white")
    .style("padding", "20px")
    .style("border-radius", "8px")
    .style("z-index", "9999")
    .html("<div>Loading data... Please wait</div>");

dataLoadStartTime = performance.now();

Promise.all(promises)
    .then(function(data) {
        const loadTime = performance.now() - dataLoadStartTime;
        console.log(`Data loaded in ${loadTime}ms`);

        crashData = data[0];
        geoData = data[1];
        solutionsData = solutionData;

        console.log('Loaded data:', {
            crashData: crashData.length,
            geoData: geoData ? 'Yes' : 'No',
            solutionsData: solutionsData ? solutionsData.length : 0
        });

        d3.select("#loading-indicator").remove();

        initMainPage(crashData, geoData, solutionsData);
    })
    .catch(function(err) {
        console.log('Error loading data:', err);
        d3.select("#loading-indicator").remove();
        d3.csv("data/dataset.csv")
            .then(function(csvData) {
                crashData = csvData;
                geoData = null;
                solutionsData = null;
                initMainPage(crashData, geoData, solutionsData);
            });
    });

function preprocessData(crashData) {
    console.log("Preprocessing data...");
    const startTime = performance.now();

    const processedData = crashData.map(d => {
        // Parse numeric fields once
        const year = +d.Year || +d['Year of collision'] || 0;
        const lat = +d.LATITUDE;
        const lng = +d.LONGITUDE;

        let injury = (d.Injury || '').trim();
        let classification = (d['Accident Classification'] || '').trim();
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
            ...d,
            Year: year,
            LATITUDE: lat,
            LONGITUDE: lng,
            Severity: severity,
            DriverAction: (d['Apparent Driver Action'] || '').trim(),
            PedestrianAction: (d['Pedestrian Action'] || '').trim(),
            CyclistAction: (d['Cyclist Action'] || '').trim()
        };
    }).filter(d =>
        d.LATITUDE && d.LONGITUDE &&
        !isNaN(d.LATITUDE) && !isNaN(d.LONGITUDE) &&
        d.LATITUDE >= 43.5 && d.LATITUDE <= 44.0 &&
        d.LONGITUDE >= -79.8 && d.LONGITUDE <= -79.0
    );

    const endTime = performance.now();
    console.log(`Data preprocessing completed in ${endTime - startTime}ms`);
    console.log(`Processed ${processedData.length} records`);

    return processedData;
}

function initMainPage(crashData, geoData, solutionsData) {
    let vis = this;

    crashData = preprocessData(crashData);

    let years = crashData.map(d => d.Year).filter(y => y > 0);
    let minYear = Math.min(...years);
    let maxYear = Math.max(...years);

    console.log('Year range:', minYear, 'to', maxYear);

    const mapContainer = d3.select('#mapDiv');
    mapContainer.html('');

    // Position the original options panel
    createOriginalOptionsPanel();

    myMapVis = new MapVis('mapDiv', crashData, geoData);
    myTimelineVis = new TimelineVis('timelineDiv', [minYear, maxYear]);

    myActionHotspotVis = null;

    window.solutionsData = solutionsData;

    myTimelineVis.onYearChange = function(year) {
        console.log('Year changed to:', year);
        // Update the current year display in options panel
        d3.select('#current-year').text(`Current Year: ${year}`);

        if (isActionAnalysisMode && myActionHotspotVis) {
            myActionHotspotVis.setYear(year);
        } else if (myMapVis) {
            myMapVis.setYear(year);
        }
    };

    myTimelineVis.setYear(minYear);
    myMapVis.setYear(minYear);

    setupFilters();
    setupActionAnalysisToggle();
    setupScrollListener();
}

function showActionAnalysis() {
    console.log('Switching to Action Analysis mode');

    const mapContainer = d3.select('#mapDiv');
    mapContainer.html('');

    // Hide the original options panel
    d3.select("#options-panel").remove();

    // Remove any existing action analysis panel first
    d3.select("#action-analysis-panel").remove();

    // Create Action Analysis panel positioned further to the right
    const actionAnalysisPanel = d3.select("body")
        .append("div")
        .attr("id", "action-analysis-panel")
        .style("position", "absolute")
        .style("top", "70px")
        .style("right", "40px")
        .style("width", "280px")
        .style("background", "rgb(25,5,5)")
        .style("border", "1px solid #ccc")
        .style("border-radius", "8px")
        .style("padding", "15px")
        .style("z-index", "1000")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
        .style("max-height", "80vh")
        .style("overflow-y", "auto");

    // Add title
    actionAnalysisPanel.append("h3")
        .text("Action Analysis")
        .style("margin-top", "0")
        .style("margin-bottom", "10px")
        .style("color", "#190505")
        .style("border-bottom", "2px solid #007bff")
        .style("padding-bottom", "8px")
        .style("font-size", "16px");


    // Year display
    actionAnalysisPanel.append("div")
        .attr("id", "action-year")
        .style("margin-bottom", "12px")
        .style("padding", "6px")
        .style("background", "#f8f9fa")
        .style("border-radius", "4px")
        .style("text-align", "center")
        .style("font-weight", "bold")
        .style("color", "#007bff")
        .style("font-size", "12px")
        .text(`Year: ${myTimelineVis ? myTimelineVis.selectedYear : '2006'}`);

    // Mode selector
    actionAnalysisPanel.append("div")
        .style("margin-bottom", "12px")
        .html(`
            <div style="margin-bottom: 4px; font-weight: bold; color: #333; font-size: 12px;">Mode:</div>
            <select id="analysis-mode" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px;">
                <option value="individual">individual</option>
                <option value="cluster">cluster</option>
                <option value="heatmap">heatmap</option>
            </select>
        `);

    // Type selector
    actionAnalysisPanel.append("div")
        .style("margin-bottom", "12px")
        .html(`
            <div style="margin-bottom: 4px; font-weight: bold; color: #333; font-size: 12px;">Type:</div>
            <select id="analysis-type" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px;">
                <option value="all">All</option>
                <option value="driver">Driver</option>
                <option value="pedestrian">Pedestrian</option>
                <option value="cyclist">Cyclist</option>
            </select>
        `);

    // Action selector
    actionAnalysisPanel.append("div")
        .style("margin-bottom", "12px")
        .html(`
            <div style="margin-bottom: 4px; font-weight: bold; color: #333; font-size: 12px;">Action:</div>
            <select id="analysis-action" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px;">
                <option value="all">All Actions</option>
            </select>
        `);

    // Display Mode section
    const displayModeSection = actionAnalysisPanel.append("div")
        .style("margin-bottom", "12px");

    displayModeSection.append("div")
        .style("margin-bottom", "6px")
        .style("font-weight", "bold")
        .style("color", "#333")
        .style("font-size", "12px")
        .text("Display Mode");

    displayModeSection.append("label")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "4px")
        .style("font-size", "11px")
        .html(`
            <input type="radio" name="display-mode" value="individual" checked style="margin-right: 6px;">
            Show Individual Accidents
        `);

    displayModeSection.append("label")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "4px")
        .style("font-size", "11px")
        .html(`
            <input type="radio" name="display-mode" value="cluster" style="margin-right: 6px;">
            Show Clusters
        `);

    displayModeSection.append("label")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "4px")
        .style("font-size", "11px")
        .html(`
            <input type="radio" name="display-mode" value="heatmap" style="margin-right: 6px;">
            Show Heatmap
        `);

    // Action Type section
    const actionTypeSection = actionAnalysisPanel.append("div")
        .style("margin-bottom", "12px");

    actionTypeSection.append("div")
        .style("margin-bottom", "6px")
        .style("font-weight", "bold")
        .style("color", "#333")
        .style("font-size", "12px")
        .text("Action Type");

    actionTypeSection.append("label")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "4px")
        .style("font-size", "11px")
        .html(`
            <input type="radio" name="action-type" value="all" checked style="margin-right: 6px;">
            All Actions
        `);

    actionTypeSection.append("label")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "4px")
        .style("font-size", "11px")
        .html(`
            <input type="radio" name="action-type" value="specific" style="margin-right: 6px;">
            Specific Action
        `);

    // Specific Action selector
    actionAnalysisPanel.append("div")
        .style("margin-bottom", "12px")
        .html(`
            <div style="margin-bottom: 4px; font-weight: bold; color: #333; font-size: 12px;">Specific Action:</div>
            <select id="specific-action" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px;">
                <option value="all">All</option>
            </select>
        `);

    // Action Types legend
    const legendSection = actionAnalysisPanel.append("div")
        .style("margin-bottom", "12px");

    legendSection.append("div")
        .style("margin-bottom", "6px")
        .style("font-weight", "bold")
        .style("color", "#333")
        .style("font-size", "12px")
        .text("Action Types:");

    const actionTypes = [
        { type: "Driver", color: "#e23725" },
        { type: "Pedestrian", color: "#007bff" },
        { type: "Cyclist", color: "#28a745" }
    ];

    actionTypes.forEach(action => {
        legendSection.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "4px")
            .style("font-size", "11px")
            .html(`
                <span style="display: inline-block; width: 10px; height: 10px; background: ${action.color}; border-radius: 2px; margin-right: 6px;"></span>
                ${action.type}
            `);
    });

    // Improvement Suggestions section
    const suggestionsSection = actionAnalysisPanel.append("div");

    suggestionsSection.append("div")
        .style("margin-bottom", "6px")
        .style("font-weight", "bold")
        .style("color", "#333")
        .style("font-size", "12px")
        .text("Improvement Suggestions");

    suggestionsSection.append("button")
        .attr("id", "show-suggestions")
        .text("Show Suggestions")
        .style("width", "100%")
        .style("padding", "6px")
        .style("background", "#28a745")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "4px")
        .style("cursor", "pointer")
        .style("font-size", "12px");

    myActionHotspotVis = new ActionHotspotVis('mapDiv', crashData, geoData, window.solutionsData);
    myActionHotspotVis.setYear(myTimelineVis.selectedYear);

    d3.select('.vis-title').text('Action Analysis - Driver, Pedestrian & Cyclist Actions');
}

function showRegularMap() {
    console.log('Switching to Regular Map mode');

    // Set the mode flag
    isActionAnalysisMode = false;

    const mapContainer = d3.select('#mapDiv');
    mapContainer.html('');

    // Remove the Action Analysis panel completely
    d3.select("#action-analysis-panel").remove();

    // Remove any ActionHotspotVis controls/side panel that might be created
    d3.select("#options-panel").remove();

    // Show and properly position the original options panel
    createOriginalOptionsPanel();

    // Make sure we have the properly preprocessed crash data
    const processedCrashData = preprocessDataForMapVis(crashData);

    // Recreate the MapVis instance with properly preprocessed data
    myMapVis = new MapVis('mapDiv', processedCrashData, geoData);

    // Set the current year from timeline
    if (myTimelineVis && myTimelineVis.selectedYear) {
        myMapVis.setYear(myTimelineVis.selectedYear);
    }

    // Update the title
    d3.select('.vis-title').text('Toronto Traffic Accidents (2006-2020)');

    // Update the toggle button text
    d3.select('#toggle-action-analysis').text('Show Action Analysis');

    console.log('Regular map and original options panel should now be visible');
}

function createOriginalOptionsPanel() {
    // Remove any existing options panel first
    d3.select("#options-panel").remove();

    // Create the original options panel with severity filters
    const optionsPanel = d3.select("body")
        .append("div")
        .attr("id", "options-panel")
        .style("position", "absolute")
        .style("top", "70px")
        .style("right", "40px")
        .style("width", "250px")
        .style("background", "rgba(255, 255, 255, 0.95)")
        .style("border", "1px solid #ccc")
        .style("border-radius", "8px")
        .style("padding", "15px")
        .style("z-index", "1000")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)");

    // Add the original filter controls
    optionsPanel.append("h3")
        .text("Filter by Severity")
        .style("margin-top", "0")
        .style("color", "#333")
        .style("border-bottom", "2px solid #007bff")
        .style("padding-bottom", "10px");

    const severityFilters = [
        { id: 'filter-fatal', label: 'Fatal', color: '#e23725' },
        { id: 'filter-major', label: 'Major', color: '#ff7f00' },
        { id: 'filter-minor', label: 'Minor', color: '#ffd700' },
        { id: 'filter-minimal', label: 'Minimal', color: '#6c757d' }
    ];

    severityFilters.forEach(filter => {
        const filterDiv = optionsPanel.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "8px");

        filterDiv.append("input")
            .attr("type", "checkbox")
            .attr("id", filter.id)
            .attr("checked", true)
            .style("margin-right", "8px")
            .on("change", updateFilters);

        filterDiv.append("label")
            .attr("for", filter.id)
            .html(`<span style="display: inline-block; width: 12px; height: 12px; background: ${filter.color}; border-radius: 2px; margin-right: 8px;"></span>${filter.label}`)
            .style("color", "#333")
            .style("cursor", "pointer");
    });

    // Add current year display
    optionsPanel.append("div")
        .attr("id", "current-year")
        .style("margin-top", "15px")
        .style("padding", "10px")
        .style("background", "#f8f9fa")
        .style("border-radius", "4px")
        .style("text-align", "center")
        .style("font-weight", "bold")
        .style("color", "#007bff")
        .text(`Current Year: ${myTimelineVis ? myTimelineVis.selectedYear : '2006'}`);

    // Re-setup the filters
    setupFilters();
}

function setupActionAnalysisToggle() {
    const button = d3.select('#toggle-action-analysis');

    // Position the toggle button further right
    button.style("position", "absolute")
        .style("right", "40px")
        .style("top", "20px")
        .style("z-index", "1001");

    button.on('click', function() {
        isActionAnalysisMode = !isActionAnalysisMode;
        if (isActionAnalysisMode) {
            showActionAnalysis();
            button.text('Show Regular Map');
        } else {
            showRegularMap();
            button.text('Show Action Analysis');
        }
    });
}



function preprocessDataForMapVis(crashData) {
    console.log("Preprocessing data specifically for MapVis...");
    const startTime = performance.now();

    const processedData = crashData.map(d => {
        const year = +d.Year || +d['Year of collision'] || 0;
        const lat = +d.LATITUDE;
        const lng = +d.LONGITUDE;

        let injury = (d.Injury || '').trim();
        let classification = (d['Accident Classification'] || '').trim();
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
            ...d,
            Year: year,
            LATITUDE: lat,
            LONGITUDE: lng,
            Severity: severity
        };
    }).filter(d =>
        d.LATITUDE && d.LONGITUDE &&
        !isNaN(d.LATITUDE) && !isNaN(d.LONGITUDE) &&
        d.LATITUDE >= 43.5 && d.LATITUDE <= 44.0 &&
        d.LONGITUDE >= -79.8 && d.LONGITUDE <= -79.0
    );

    const endTime = performance.now();
    console.log(`MapVis data preprocessing completed in ${endTime - startTime}ms`);
    console.log(`Processed ${processedData.length} records for MapVis`);

    return processedData;
}

function getCurrentFilters() {
    let activeFilters = [];
    if (d3.select('#filter-fatal').property('checked')) activeFilters.push('Fatal');
    if (d3.select('#filter-major').property('checked')) activeFilters.push('Major');
    if (d3.select('#filter-minor').property('checked')) activeFilters.push('Minor');
    if (d3.select('#filter-minimal').property('checked')) activeFilters.push('Minimal');
    return activeFilters;
}

function setupFilters() {
    let filterCheckboxes = [
        { id: 'filter-fatal', severity: 'Fatal' },
        { id: 'filter-major', severity: 'Major' },
        { id: 'filter-minor', severity: 'Minor' },
        { id: 'filter-minimal', severity: 'Minimal' }
    ];

    filterCheckboxes.forEach(filter => {
        d3.select('#' + filter.id).on('change', function() {
            updateFilters();
        });
    });
}

function updateFilters() {
    let activeFilters = getCurrentFilters();

    if (myMapVis && !isActionAnalysisMode) {
        myMapVis.setFilters(activeFilters);
    }
}

function setupScrollListener() {
    let scrollThrottle = null;

    window.addEventListener('scroll', function() {
        if (scrollThrottle) {
            clearTimeout(scrollThrottle);
        }

        scrollThrottle = setTimeout(function() {
            updateYearFromScroll();
        }, 10);
    });
}

function updateYearFromScroll() {
    if (!myTimelineVis) return;

    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    let scrollPercent = Math.max(0, Math.min(1, scrollTop / documentHeight));

    let yearRange = myTimelineVis.yearRange;
    let selectedYear = Math.round(yearRange[0] + scrollPercent * (yearRange[1] - yearRange[0]));

    selectedYear =  Math.max(yearRange[0], Math.min(yearRange[1], selectedYear));

    if (myTimelineVis.selectedYear !== selectedYear) {
        myTimelineVis.setYear(selectedYear);
        if (isActionAnalysisMode && myActionHotspotVis) {
            myActionHotspotVis.setYear(selectedYear);
        } else if (myMapVis) {
            myMapVis.setYear(selectedYear);
        }
    }
}