/* * * * * * * * * * * * * * *
*           MAIN              *
* * * * * * * * * * * * * * */

let myMapVis,
    myTimelineVis;

let promises = [
    d3.csv("data/dataset.csv"),
    d3.json("data/Centreline - Version 2 - 4326.geojson")
];

Promise.all(promises)
    .then(function(data) {
        initMainPage(data[0], data[1]);
    })
    .catch(function(err) {
        console.log(err);
        // If GeoJSON fails, continue without it
        d3.csv("data/dataset.csv")
            .then(function(csvData) {
                initMainPage(csvData, null);
            });
    });

function initMainPage(crashData, geoData) {
    let vis = this;

    // Parse and clean crash data
    crashData.forEach(d => {
        d.Year = +d.Year || +d['Year of collision'] || 0;
        d.LATITUDE = +d.LATITUDE;
        d.LONGITUDE = +d.LONGITUDE;
    });

    crashData = crashData.filter(d =>
        d.LATITUDE && d.LONGITUDE &&
        !isNaN(d.LATITUDE) && !isNaN(d.LONGITUDE) &&
        d.LATITUDE >= 43.5 && d.LATITUDE <= 44.0 &&
        d.LONGITUDE >= -79.8 && d.LONGITUDE <= -79.0
    );

    let years = crashData.map(d => d.Year).filter(y => y > 0);
    let minYear = Math.min(...years);
    let maxYear = Math.max(...years);

    console.log('Year range:', minYear, 'to', maxYear);

    // Initialize visualizations
    myMapVis = new MapVis('mapDiv', crashData, geoData);
    myTimelineVis = new TimelineVis('timelineDiv', [minYear, maxYear]);


    // Connect timeline to map
    myTimelineVis.onYearChange = function(year) {
        console.log('Timeline year changed to:', year);
        myMapVis.setYear(year);
        // Also update ActionHotspotVis if it exists
        if (window.myActionHotspotVis) {
            console.log('Also updating ActionHotspotVis year to:', year);
            window.myActionHotspotVis.setYear(year);
        }
    };

    // Set initial year
    myTimelineVis.setYear(minYear);
    myMapVis.setYear(minYear);

    // Set up filter checkboxes
    setupFilters();

    // Set up scroll listener
    setupScrollListener();
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
    let activeFilters = [];

    if (d3.select('#filter-fatal').property('checked')) activeFilters.push('Fatal');
    if (d3.select('#filter-major').property('checked')) activeFilters.push('Major');
    if (d3.select('#filter-minor').property('checked')) activeFilters.push('Minor');
    if (d3.select('#filter-minimal').property('checked')) activeFilters.push('Minimal');

    myMapVis.setFilters(activeFilters);
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

function switchToActionAnalysis() {
    console.log('🔄 SWITCHING TO ACTION ANALYSIS');

    // First, ensure timeline is reset to beginning
    if (window.myTimelineVis) {
        const beginningYear = window.myTimelineVis.yearRange[0];
        console.log('📅 Setting timeline to beginning year:', beginningYear);

        // Directly set the timeline to beginning
        window.myTimelineVis.selectedYear = beginningYear;
        window.myTimelineVis.updateTimelinePosition();

        // CRITICAL: Reconnect timeline to control ActionHotspotVis
        window.myTimelineVis.onYearChange = function(year) {
            console.log('Timeline -> ActionHotspotVis:', year);
            if (window.myActionHotspotVis) {
                window.myActionHotspotVis.setYear(year);
            }

            if (window.myMapVis) {
            }
        };
    }

    // Then switch to action analysis
    if (window.myMapVis) {
        window.myMapVis.switchToActionAnalysis();
    } else {
        console.error('MapVis not initialized');
    }
}

window.switchToActionAnalysis = switchToActionAnalysis;

window.switchToMainMap = switchToMainMap;
