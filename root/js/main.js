/* * * * * * * * * * * * * * *
*           MAIN              *
* * * * * * * * * * * * * * */

// init global variables, switches, helper functions
let myMapVis,
    myTimelineVis,
    myLocationChart;

// Load data using promises
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

// initMainPage
function initMainPage(crashData, geoData) {
    let vis = this;

    // Parse and clean crash data
    crashData.forEach(d => {
        d.Year = +d.Year || +d['Year of collision'] || 0;
        d.LATITUDE = +d.LATITUDE;
        d.LONGITUDE = +d.LONGITUDE;
    });

    // Filter out invalid coordinates
    crashData = crashData.filter(d => 
        d.LATITUDE && d.LONGITUDE && 
        !isNaN(d.LATITUDE) && !isNaN(d.LONGITUDE) &&
        d.LATITUDE >= 43.5 && d.LATITUDE <= 44.0 &&
        d.LONGITUDE >= -79.8 && d.LONGITUDE <= -79.0
    );

    // Find actual year range from data
    let years = crashData.map(d => d.Year).filter(y => y > 0);
    let minYear = Math.min(...years);
    let maxYear = Math.max(...years);

    // Create visualization instances (don't initialize yet)
    myMapVis = new MapVis('mapDiv', crashData, geoData);
    myTimelineVis = new TimelineVis('timelineDiv', [minYear, maxYear]);
    myLocationChart = new LocationChart('locationChart', crashData);

    // Initialize MapVis first (needed for SVG and projection)
    myMapVis.initVis();

    // Create and initialize CrashPointsVis with MapVis's SVG and projection
    myCrashPointsVis = new CrashPointsVis(myMapVis.svg, myMapVis.projection, myMapVis.severityColors);
    myMapVis.crashPointsVis = myCrashPointsVis; // Store reference in MapVis
    myCrashPointsVis.initVis();

    // Initialize TimelineVis
    myTimelineVis.initVis();

    // Connect timeline to map
    myTimelineVis.onYearChange = function(year) {
        myMapVis.setYear(year);
        myLocationChart.setYear(year);
    };

    // Set initial year
    myTimelineVis.setYear(minYear);
    myMapVis.setYear(minYear);
    myLocationChart.setYear(minYear);

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
    myLocationChart.setFilters(activeFilters);
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
    
    // Calculate scroll position
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    let scrollPercent = Math.max(0, Math.min(1, scrollTop / documentHeight));
    
    // Map scroll position to year range
    let yearRange = myTimelineVis.yearRange;
    let selectedYear = Math.round(yearRange[0] + scrollPercent * (yearRange[1] - yearRange[0]));
    
    // Clamp to valid range
    selectedYear = Math.max(yearRange[0], Math.min(yearRange[1], selectedYear));
    
    // Update timeline and map
    if (myTimelineVis.selectedYear !== selectedYear) {
        myTimelineVis.setYear(selectedYear);
        myMapVis.setYear(selectedYear);
    }
}

