/* * * * * * * * * * * * * * *
*      ImprovementsVis        *
* * * * * * * * * * * * * * */

class ImprovementsVis {

    constructor(svg, projection, crashData) {
        let vis = this;
        vis.svg = svg;
        vis.projection = projection;
        vis.crashData = crashData;
        
        // Improvement types configuration
        vis.improvementTypes = {
            'speeding': {
                name: 'Speeding',
                label: 'Speeding',
                color: 'rgba(237,225,55,0.8)',
                improvement: 'Dynamic Speed Signs',
                url: 'https://roadsafetystrategy.ca/en/listing-directory/roadsafetystrategy/changeable_%28variable%2C_dynamic%2C_active%29_message_signs'
            },
            'dark': {
                name: 'Dark',
                label: 'Dark',
                color: 'rgba(0,0,0,0.64)',
                improvement: 'Street Lighting',
                url: 'https://roadsafetystrategy.ca/en/listing-directory/roadsafetystrategy/street_lighting_and_illumination'
            },
            'ice': {
                name: 'Ice',
                label: 'Ice',
                color: 'rgba(58,93,220,0.8)',
                improvement: 'Anti-icing Technology',
                url: 'https://roadsafetystrategy.ca/en/listing-directory/roadsafetystrategy/anti-icing_technology'
            },
            'inattentive': {
                name: 'Inattentive Driver',
                label: 'Inattentive Driver',
                color: 'rgba(237,70,55,0.8)',
                improvement: 'Rumble Strips',
                url: 'https://roadsafetystrategy.ca/en/listing-directory/roadsafetystrategy/rumble_strips'
            }
        };
        
        vis.selectedYear = null;
        vis.activeFactors = ['speeding', 'dark', 'ice', 'inattentive'];
        vis.displayData = [];
        
        // Don't auto-initialize - let main.js control initialization
    }

    initVis() {
        let vis = this;
        
        // Initialize data storage
        vis.displayData = [];
        
        // Create tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "improvement-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("pointer-events", "none")
            .style("font-family", "Overpass, sans-serif")
            .style("font-size", "12px")
            .style("z-index", "1000");
        
        // Initially hide improvement circles
        vis.hide();
    }

    createFactorFilters() {
        let vis = this;
        let optionsPanel = d3.select("#options-panel");
        
        // Remove any existing factor filters first
        optionsPanel.selectAll(".filter-option")
            .filter(function() {
                let input = d3.select(this).select("input").node();
                return input && input.id && input.id.startsWith("factor-");
            })
            .remove();
        
        // Update title
        optionsPanel.select(".options-title")
            .text("Factors in Accident");
        
        // Hide existing severity filters (don't remove them)
        optionsPanel.selectAll(".filter-option")
            .filter(function() {
                let input = d3.select(this).select("input").node();
                return input && input.id && input.id.startsWith("filter-");
            })
            .style("display", "none");
        
        // Create factor filters
        let factorData = [
            { id: 'factor-speeding', key: 'speeding', label: 'Speeding' },
            { id: 'factor-dark', key: 'dark', label: 'Dark' },
            { id: 'factor-ice', key: 'ice', label: 'Ice' },
            { id: 'factor-inattentive', key: 'inattentive', label: 'Inattentive Driver' }
        ];
        
        // Find insertion point - after title, before location chart
        let title = optionsPanel.select(".options-title").node();
        let locationChartContainer = optionsPanel.select(".mt-4").node();
        
        if (!title || !locationChartContainer) {
            console.error("Could not find title or location chart container");
            return;
        }
        
        // Create all filter divs first, then insert them in reverse order
        // so they appear in the correct order
        let filterDivs = [];
        factorData.forEach((factor, i) => {
            // Create the div element
            let filterDiv = document.createElement("div");
            filterDiv.className = "filter-option mb-2";
            filterDiv.style.display = "block";
            filterDiv.style.visibility = "visible";
            filterDivs.push(filterDiv);
            
            // Now use D3 to populate it
            let filterDivD3 = d3.select(filterDiv);
            
            filterDivD3.append("input")
                .attr("type", "checkbox")
                .attr("id", factor.id)
                .property("checked", vis.activeFactors.includes(factor.key))
                .on("change", function() {
                    vis.updateActiveFactors();
                });
            
            let label = filterDivD3.append("label")
                .attr("for", factor.id)
                .attr("class", "d-flex align-items-center");
            
            label.append("span")
                .attr("class", "filter-indicator me-2");
            
            let labelSpan = label.append("span")
                .attr("class", "filter-label me-auto");
            
            // Handle "Inattentive Driver" on two lines
            if (factor.key === 'inattentive') {
                labelSpan.html("Inattentive<br/>Driver");
            } else {
                labelSpan.text(factor.label);
            }
            
            label.append("span")
                .attr("class", "filter-checkbox " + factor.key)
                .style("background-color", vis.improvementTypes[factor.key].color);
        });
        
        // Insert all filter divs before location chart container (in reverse order)
        // so they appear in the correct order (speeding, dark, ice, inattentive)
        filterDivs.reverse().forEach(filterDiv => {
            locationChartContainer.parentNode.insertBefore(filterDiv, locationChartContainer);
        });
        
        // Store reference to last factor filter for back button insertion
        vis.lastFactorFilter = filterDivs[0]; // First in reversed array is last in DOM
    }

    createBackButton() {
        let vis = this;
        let optionsPanel = d3.select("#options-panel");
        
        // Remove existing back button if it exists
        optionsPanel.select("#backButton").remove();
        
        // Find location chart container to insert before it
        let locationChartContainer = optionsPanel.select(".mt-4").node();
        
        if (!locationChartContainer) {
            console.error("Could not find location chart container");
            return;
        }
        
        // Create back button element
        let backButtonElement = document.createElement("button");
        backButtonElement.id = "backButton";
        backButtonElement.className = "btn btn-primary w-100 mt-3 mb-2";
        backButtonElement.style.display = "block";
        backButtonElement.style.visibility = "visible";
        backButtonElement.textContent = "Back";
        
        // Insert before location chart container (after factor filters)
        locationChartContainer.parentNode.insertBefore(backButtonElement, locationChartContainer);
        
        // Use D3 to add styles and event handler
        d3.select(backButtonElement)
            .style("background-color", "#000")
            .style("border", "none")
            .style("border-radius", "27px")
            .style("box-shadow", "0px 4px 1px rgba(0,0,0,0.25)")
            .style("color", "white")
            .style("font-weight", "700")
            .style("cursor", "pointer")
            .on("click", function() {
                if (vis.onBackClick) {
                    vis.onBackClick();
                }
            });
    }

    removeFactorFilters() {
        let vis = this;
        let optionsPanel = d3.select("#options-panel");
        
        // Restore original title
        optionsPanel.select(".options-title")
            .text("Filters");
        
        // Remove factor filters (only the ones we created)
        optionsPanel.selectAll(".filter-option")
            .filter(function() {
                let input = d3.select(this).select("input").node();
                return input && input.id && input.id.startsWith("factor-");
            })
            .remove();
        
        // Show severity filters again
        optionsPanel.selectAll(".filter-option")
            .filter(function() {
                let input = d3.select(this).select("input").node();
                return input && input.id && input.id.startsWith("filter-");
            })
            .style("display", "block");
        
        // Remove back button
        optionsPanel.select("#backButton").remove();
    }

    updateActiveFactors() {
        let vis = this;
        vis.activeFactors = [];
        
        ['speeding', 'dark', 'ice', 'inattentive'].forEach(key => {
            let checkbox = d3.select('#factor-' + key);
            if (!checkbox.empty() && checkbox.property('checked')) {
                vis.activeFactors.push(key);
            }
        });
        
        // Update visualization with new active factors
        if (vis.selectedYear !== null) {
            vis.wrangleData(vis.crashData, vis.selectedYear);
        }
    }

    wrangleData(crashData, selectedYear) {
        let vis = this;
        
        vis.selectedYear = selectedYear;
        vis.crashData = crashData;
        
        // Filter by year and identify crashes by factor
        let filteredData = crashData.filter(d => {
            let year = +d.Year || +d['Year of collision'] || 0;
            return year === selectedYear &&
                   d.LATITUDE && 
                   d.LONGITUDE &&
                   !isNaN(+d.LATITUDE) && 
                   !isNaN(+d.LONGITUDE);
        });
        
        // Identify crashes by factor
        let crashesByFactor = {
            'speeding': [],
            'dark': [],
            'ice': [],
            'inattentive': []
        };
        
        filteredData.forEach(d => {
            // Check for speeding
            let speeding = (d['Speeding Related'] || '').trim();
            if (speeding && speeding.toLowerCase() === 'yes') {
                crashesByFactor.speeding.push(d);
            }
            
            // Check for darkness
            let light = (d.LIGHT || '').trim().replace(/^"|"$/g, '');
            if (light === 'Dark') {
                crashesByFactor.dark.push(d);
            }
            
            // Check for ice
            let roadSurface = (d['Road Surface Condition'] || '').trim().replace(/^"|"$/g, '');
            if (roadSurface === 'Ice') {
                crashesByFactor.ice.push(d);
            }
            
            // Check for inattentive drivers
            let distracted = (d['Aggressive and Distracted Driving Related'] || '').trim();
            if (distracted && distracted.toLowerCase() === 'yes') {
                crashesByFactor.inattentive.push(d);
            }
        });
        
        // Group by location and factor type, calculate need levels
        vis.displayData = [];
        
        vis.activeFactors.forEach(factorKey => {
            let crashes = crashesByFactor[factorKey];
            if (crashes.length === 0) return;
            
            // Group by location (cluster nearby crashes)
            let clusterMap = {};
            crashes.forEach(crash => {
                let lat = +crash.LATITUDE;
                let lng = +crash.LONGITUDE;
                
                // Round to nearest 0.001 degrees for clustering (~100m)
                let roundedLat = Math.round(lat * 1000) / 1000;
                let roundedLng = Math.round(lng * 1000) / 1000;
                let key = roundedLat + '_' + roundedLng;
                
                if (!clusterMap[key]) {
                    clusterMap[key] = [];
                }
                clusterMap[key].push(crash);
            });
            
            // Create improvement points
            Object.values(clusterMap).forEach(cluster => {
                let baseCrash = cluster[0];
                let needLevel = cluster.length;
                
                vis.displayData.push({
                    lat: +baseCrash.LATITUDE,
                    lng: +baseCrash.LONGITUDE,
                    factor: factorKey,
                    needLevel: needLevel,
                    crashCount: needLevel,
                    improvement: vis.improvementTypes[factorKey].improvement,
                    color: vis.improvementTypes[factorKey].color,
                    url: vis.improvementTypes[factorKey].url
                });
            });
        });
        
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Helper function to get x coordinate
        let getX = function(d) {
            if (vis.projection) {
                return vis.projection([d.lng, d.lat])[0];
            }
            return 0;
        };
        
        // Helper function to get y coordinate
        let getY = function(d) {
            if (vis.projection) {
                return vis.projection([d.lng, d.lat])[1];
            }
            return 0;
        };
        
        // Calculate radius scale based on need level (area-based)
        let maxNeed = d3.max(vis.displayData, d => d.needLevel) || 1;
        let minRadius = 5;
        let maxRadius = 30;
        let radiusScale = d3.scaleSqrt()
            .domain([1, maxNeed])
            .range([minRadius, maxRadius]);

        // D3 update pattern - Bind data with key function
        let improvementCircles = vis.svg.selectAll(".improvement-circle")
            .data(vis.displayData, d => d.lat + '_' + d.lng + '_' + d.factor);

        // Exit - Remove elements that are no longer in the data
        improvementCircles.exit()
            .transition()
            .duration(300)
            .attr("r", 0)
            .attr("opacity", 0)
            .remove();

        // Enter - Add new elements with initial state
        let enter = improvementCircles.enter()
            .append("circle")
            .attr("class", "improvement-circle")
            .attr("cx", getX)
            .attr("cy", getY)
            .attr("r", 0)
            .attr("opacity", 0)
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                vis.showTooltip(event, d);
            })
            .on("mousemove", function(event, d) {
                vis.moveTooltip(event);
            })
            .on("mouseout", function() {
                vis.hideTooltip();
            })
            .on("dblclick", function(event, d) {
                vis.showDetailModal(d);
            });

        // Merge - Combine enter and update selections, set final state
        let merge = enter.merge(improvementCircles);

        merge
            .transition()
            .duration(300)
            .attr("cx", getX)
            .attr("cy", getY)
            .attr("r", d => radiusScale(d.needLevel))
            .attr("opacity", 0.8)
            .attr("fill", d => d.color);
    }

    showTooltip(event, d) {
        let vis = this;
        vis.tooltip
            .style("opacity", 1)
            .html(`
                <strong>${d.improvement}</strong><br/>
                Factor: ${vis.improvementTypes[d.factor].name}<br/>
                Crashes: ${d.crashCount}
            `);
        vis.moveTooltip(event);
    }

    moveTooltip(event) {
        let vis = this;
        vis.tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    hideTooltip() {
        let vis = this;
        vis.tooltip.style("opacity", 0);
    }

    showDetailModal(d) {
        let vis = this;
        
        // Remove existing modal if any
        d3.select("#improvement-modal").remove();
        
        // Create modal
        let modal = d3.select("body")
            .append("div")
            .attr("id", "improvement-modal")
            .style("position", "fixed")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("z-index", "2000")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .on("click", function() {
                modal.remove();
            });
        
        let modalContent = modal.append("div")
            .style("background-color", "white")
            .style("padding", "30px")
            .style("border-radius", "12px")
            .style("max-width", "600px")
            .style("max-height", "80vh")
            .style("overflow-y", "auto")
            .style("position", "relative")
            .on("click", function(event) {
                event.stopPropagation();
            });
        
        modalContent.append("button")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "10px")
            .style("background", "none")
            .style("border", "none")
            .style("font-size", "24px")
            .style("cursor", "pointer")
            .text("×")
            .on("click", function() {
                modal.remove();
            });
        
        modalContent.append("h2")
            .style("font-family", "Overpass, sans-serif")
            .style("font-weight", "800")
            .style("margin-bottom", "20px")
            .text(d.improvement);
        
        modalContent.append("p")
            .style("font-family", "Overpass, sans-serif")
            .style("margin-bottom", "10px")
            .html(`<strong>Factor:</strong> ${vis.improvementTypes[d.factor].name}`);
        
        modalContent.append("p")
            .style("font-family", "Overpass, sans-serif")
            .style("margin-bottom", "10px")
            .html(`<strong>Number of crashes:</strong> ${d.crashCount}`);
        
        modalContent.append("p")
            .style("font-family", "Overpass, sans-serif")
            .style("margin-bottom", "20px")
            .html(`<strong>Location:</strong> ${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`);
        
        modalContent.append("a")
            .attr("href", d.url)
            .attr("target", "_blank")
            .style("display", "inline-block")
            .style("padding", "10px 20px")
            .style("background-color", "#000")
            .style("color", "white")
            .style("text-decoration", "none")
            .style("border-radius", "5px")
            .style("font-family", "Overpass, sans-serif")
            .style("font-weight", "700")
            .text("Learn More");
    }

    // Update positions of existing circles when map zooms/pans
    updateCoordinates(projection) {
        let vis = this;
        vis.projection = projection;

        let circles = vis.svg.selectAll(".improvement-circle");
        if (!circles.empty()) {
            circles
                .attr("cx", function(d) {
                    if (d && d.lng !== undefined && d.lat !== undefined && vis.projection) {
                        let coords = vis.projection([d.lng, d.lat]);
                        return coords ? coords[0] : 0;
                    }
                    return 0;
                })
                .attr("cy", function(d) {
                    if (d && d.lng !== undefined && d.lat !== undefined && vis.projection) {
                        let coords = vis.projection([d.lng, d.lat]);
                        return coords ? coords[1] : 0;
                    }
                    return 0;
                });
        }
    }

    show() {
        let vis = this;
        vis.svg.selectAll(".improvement-circle").style("display", "block");
    }

    hide() {
        let vis = this;
        vis.svg.selectAll(".improvement-circle").style("display", "none");
    }
}

