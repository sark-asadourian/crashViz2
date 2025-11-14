/* * * * * * * * * * * * * * *
*        TimelineVis          *
* * * * * * * * * * * * * * */

class TimelineVis {

    constructor(parentElement, yearRange) {
        let vis = this;
        vis.parentElement = parentElement;
        vis.yearRange = yearRange || [2006, 2024];
        vis.selectedYear = vis.yearRange[0];
        vis.onYearChange = null;

        vis.initVis();
        vis.setupPlaybackControls();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 0, right: 0, bottom: 40, left: 0};
        vis.width = 831 - vis.margin.left - vis.margin.right;
        vis.height = 27;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Year scale
        vis.yearScale = d3.scaleTime()
            .domain([new Date(vis.yearRange[0], 0, 1), new Date(vis.yearRange[1], 0, 1)])
            .range([35, vis.width]);

        // Create slider track
        vis.track = vis.svg.append("rect")
            .attr("class", "timeline-track")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("rx", 7)
            .attr("fill", "#fff")
            .style("filter", "drop-shadow(0px 4px 1px rgba(0,0,0,0.25))");

        // Create dashed line
        vis.line = vis.svg.append("line")
            .attr("class", "timeline-line")
            .attr("x1", 0)
            .attr("y1", vis.height / 2)
            .attr("x2", vis.width)
            .attr("y2", vis.height / 2)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5");

        // Create triangular handle
        let initialX = vis.yearScale(new Date(vis.selectedYear, 0, 1));
        vis.handle = vis.svg.append("g")
            .attr("class", "timeline-handle")
            .attr("transform", `translate(${initialX}, ${vis.height / 2})`);

        vis.handle.append("polygon")
            .attr("points", "-18.5,-18.5 0,0 -18.5,18.5")
            .attr("fill", "#ec6b68")
            .attr("transform", "rotate(90)");

        // Year labels - dynamically generate based on year range
        vis.years = [];
        for (let y = vis.yearRange[0]; y <= vis.yearRange[1]; y += 2) {
            vis.years.push(y);
        }

        vis.yearLabels = vis.svg.selectAll(".year-label")
            .data(vis.years)
            .enter()
            .append("text")
            .attr("class", "year-label")
            .attr("x", d => vis.yearScale(new Date(d, 0, 1)))
            .attr("y", vis.height + 20)
            .attr("text-anchor", "middle")
            .attr("font-family", "Overpass, sans-serif")
            .attr("font-weight", 800)
            .attr("font-size", "16px")
            .attr("fill", "#000")
            .text(d => d);

        // Drag functionality
        vis.drag = d3.drag()
            .on("start", function (event) {
                d3.select(this).raise();
            })
            .on("drag", function (event) {
                let x = Math.max(13, Math.min(vis.width - 13, event.x));
                vis.handle.attr("transform", `translate(${x}, ${vis.height / 2})`);

                // Calculate year from position
                let year = Math.round(vis.yearScale.invert(x).getFullYear());
                if (year !== vis.selectedYear && year >= vis.yearRange[0] && year <= vis.yearRange[1]) {
                    vis.selectedYear = year;
                    if (vis.onYearChange) {
                        vis.onYearChange(year);
                    }
                }
            });

        vis.handle.call(vis.drag);

        vis.updateVis();
    }

    setupPlaybackControls() {
        let vis = this;

        // Create playback controls container
        vis.playbackContainer = d3.select("#" + vis.parentElement)
            .append("div")
            .attr("id", "timeline-controls")
            .style("display", "flex")
            .style("align-items", "center")
            .style("left", "-90px")
            .style("gap", "15px")
            .style("margin-top", "10px")
            .style("padding-left", "20px");

        // Create play button
        vis.playButton = vis.playbackContainer.append("button")
            .attr("id", "playButton")
            .attr("class", "play-button")
            .html('<span class="play-icon">▶</span><span class="play-text">Go</span>');

        // Playback state variables
        vis.isPlaying = false;
        vis.playbackInterval = null;
        vis.currentPlaybackYear = vis.selectedYear;

        // Playback speed (milliseconds per year)
        vis.PLAYBACK_SPEED = 800;

        // Add event listeners
        vis.playButton.on("click", function () {
            vis.togglePlayback();
        });
    }

    startPlayback() {
        let vis = this;

        vis.isPlaying = true;
        vis.currentPlaybackYear = vis.selectedYear;

        vis.playButton.classed("playing", true);
        vis.playButton.html('<span class="play-icon">⏸</span><span class="play-text">Pause</span>');

        vis.playbackInterval = setInterval(() => {
            // Move to next year
            vis.currentPlaybackYear++;

            // Loop back to start if we reach the end
            if (vis.currentPlaybackYear > vis.yearRange[1]) {
                vis.currentPlaybackYear = vis.yearRange[0];
            }

            // Update timeline and trigger year change
            vis.setYear(vis.currentPlaybackYear);

        }, vis.PLAYBACK_SPEED);
    }

    stopPlayback() {
        let vis = this;

        vis.isPlaying = false;
        vis.playButton.classed("playing", false);
        vis.playButton.html('<span class="play-icon">▶</span><span class="play-text">Go</span>');

        if (vis.playbackInterval) {
            clearInterval(vis.playbackInterval);
            vis.playbackInterval = null;
        }
    }

    togglePlayback() {
        let vis = this;
        if (vis.isPlaying) {
            vis.stopPlayback();
        } else {
            vis.startPlayback();
        }
    }

    resetToBeginning() {
        let vis = this;
        const beginningYear = vis.yearRange[0];
        console.log('Resetting timeline to beginning year:', beginningYear);

        vis.stopPlayback();

        vis.setYear(beginningYear);

        setTimeout(() => {
            let currentX = vis.yearScale(new Date(beginningYear, 0, 1));
            console.log('Verifying handle position:', currentX);
            vis.handle.attr("transform", `translate(${currentX}, ${vis.height / 2})`);
        }, 50);
    }

    wrangleData() {
        let vis = this;
        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        // Handle position is updated in drag handler
    }

    updateTimelinePosition() {
        let vis = this;

        if (vis.timelineHandle) {
            vis.timelineHandle
                .attr("cx", vis.xScale(vis.selectedYear))
                .attr("cy", vis.height / 2);
        }

        // Update the year display if it exists
        if (vis.yearDisplay) {
            vis.yearDisplay.text(vis.selectedYear);
        }

        // Trigger the year change callback
        if (vis.onYearChange) {
            vis.onYearChange(vis.selectedYear);
        }
    }

    setYear(year) {
        let vis = this;
        if (year >= vis.yearRange[0] && year <= vis.yearRange[1]) {
            vis.selectedYear = year;
            let x = vis.yearScale(new Date(year, 0, 1));
            vis.handle.attr("transform", `translate(${x}, ${vis.height / 2})`);

            // Trigger the year change callback
            if (vis.onYearChange) {
                vis.onYearChange(year);
            }

            console.log('Timeline handle moved to year:', year, 'position:', x);
        }
    }
}