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
    console.log('Available years:', [...new Set(years)].sort());

    const mapContainer = d3.select('#mapDiv');
    mapContainer.html('');

    myMapVis = new MapVis('mapDiv', crashData, geoData);
    myTimelineVis = new TimelineVis('timelineDiv', [minYear, maxYear]);

    myActionHotspotVis = null;

    window.solutionsData = solutionsData;

    myTimelineVis.onYearChange = function(year) {
        console.log('Year changed to:', year);
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

    d3.select('#options-panel').style('display', 'none');

    myActionHotspotVis = new ActionHotspotVis('mapDiv', crashData, geoData, window.solutionsData);

    myActionHotspotVis.setYear(myTimelineVis.selectedYear);

    d3.select('.vis-title').text('Action Analysis - Driver, Pedestrian & Cyclist Actions');
}

function showRegularMap() {
    console.log('Switching to Regular Map mode');

    const mapContainer = d3.select('#mapDiv');
    mapContainer.html('');

    d3.select('#options-panel').style('display', 'block');

    setTimeout(() => {
        try {
            console.log('Creating new MapVis instance...');

            const mapVisCrashData = preprocessDataForMapVis(crashData);

            console.log('Available data:', {
                crashData: mapVisCrashData ? mapVisCrashData.length : 'undefined',
                geoData: geoData ? 'Yes' : 'No'
            });

            myMapVis = new MapVis('mapDiv', mapVisCrashData, geoData);
            console.log('MapVis created successfully');

            if (myTimelineVis && myTimelineVis.selectedYear) {
                myMapVis.setYear(myTimelineVis.selectedYear);
                console.log('Year set to:', myTimelineVis.selectedYear);
            }

            let activeFilters = getCurrentFilters();
            myMapVis.setFilters(activeFilters);
            console.log('Filters applied:', activeFilters);

            if (myMapVis.ensureLabelsVisible) {
                myMapVis.ensureLabelsVisible();
            }

            d3.select('.vis-title').text('Toronto Traffic Accidents (2006-2020)');

        } catch (error) {
            console.error('Error creating MapVis:', error);

            mapContainer.html(`
                <div style="padding: 40px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                    <h3>Error Loading Regular Map</h3>
                    <p>${error.message}</p>
                    <button onclick="showRegularMap()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
                        Try Again
                    </button>
                </div>
            `);
        }
    }, 50);
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

function setupActionAnalysisToggle() {
    const button = d3.select('#toggle-action-analysis');

    button.on('click', function() {
        isActionAnalysisMode = !isActionAnalysisMode;

        if (isActionAnalysisMode) {
            showActionAnalysis();
            button.classed('active', true).text('Show Regular Map');
        } else {
            showRegularMap();
            button.classed('active', false).text('Show Action Analysis');
        }
    });
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

    selectedYear = Math.max(yearRange[0], Math.min(yearRange[1], selectedYear));

    if (myTimelineVis.selectedYear !== selectedYear) {
        myTimelineVis.setYear(selectedYear);
        if (isActionAnalysisMode && myActionHotspotVis) {
            myActionHotspotVis.setYear(selectedYear);
        } else if (myMapVis) {
            myMapVis.setYear(selectedYear);
        }
    }
}