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

        vis.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 30, right: 60, bottom: 60, left: 60};
        vis.width = 900 - vis.margin.left - vis.margin.right;
        vis.height = 140;

        d3.select("#" + vis.parentElement).html("");

        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.xScale = d3.scaleLinear()
            .domain([vis.yearRange[0], vis.yearRange[1]])
            .range([0, vis.width]);

        const trackY = vis.height / 2;

        vis.svg.append("rect")
            .attr("x", -25)
            .attr("y", trackY - 25)
            .attr("width", vis.width + 50)
            .attr("height", 50)
            .attr("rx", 12)
            .attr("fill", "#2f2f2f")
            .attr("stroke", "#555")
            .attr("stroke-width", 2);

        vis.svg.append("line")
            .attr("x1", -5)
            .attr("x2", vis.width + 5)
            .attr("y1", trackY)
            .attr("y2", trackY)
            .attr("stroke", "#dcdcdc")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "10,10")
            .attr("stroke-linecap", "round");

        vis.years = [];
        for (let y = vis.yearRange[0]; y <= vis.yearRange[1]; y++) {
            vis.years.push(y);
        }

        vis.yearLabels = vis.svg.selectAll(".year-label")
            .data(vis.years)
            .enter()
            .append("text")
            .attr("class", "year-label")
            .attr("x", d => vis.xScale(d))
            .attr("y", trackY - 40)
            .attr("text-anchor", "middle")
            .attr("font-family", "Overpass, sans-serif")
            .attr("font-size", "12px")
            .attr("fill", d => d === vis.selectedYear ? "#ffeb3b" : "#ccc")
            .attr("font-weight", d => d === vis.selectedYear ? "bold" : "normal")
            .style("pointer-events", "none")
            .text(d => d);

        const carWidth = 36;
        const carHeight = 20;

        // Car body
        let initialX = vis.xScale(vis.selectedYear);
        vis.car = vis.svg.append("g")
            .attr("class", "car-slider")
            .attr("transform", `translate(${initialX - carWidth/2}, ${trackY - carHeight/2})`)
            .style("cursor", "grab");

        // Car body (main rectangle)
        vis.car.append("rect")
            .attr("width", carWidth)
            .attr("height", carHeight)
            .attr("rx", 4)
            .attr("fill", "#ff4757")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        // Car windows
        vis.car.append("rect")
            .attr("x", 4)
            .attr("y", 4)
            .attr("width", 12)
            .attr("height", 8)
            .attr("rx", 2)
            .attr("fill", "#87CEEB");

        vis.car.append("rect")
            .attr("x", 20)
            .attr("y", 4)
            .attr("width", 12)
            .attr("height", 8)
            .attr("rx", 2)
            .attr("fill", "#87CEEB");

        // Car wheels
        vis.car.append("circle")
            .attr("cx", 8)
            .attr("cy", carHeight)
            .attr("r", 4)
            .attr("fill", "#333")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

        vis.car.append("circle")
            .attr("cx", carWidth - 8)
            .attr("cy", carHeight)
            .attr("r", 4)
            .attr("fill", "#333")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

        // Headlights
        vis.car.append("circle")
            .attr("cx", 2)
            .attr("cy", 8)
            .attr("r", 2)
            .attr("fill", "#ffeb3b");

        vis.car.append("circle")
            .attr("cx", carWidth - 2)
            .attr("cy", 8)
            .attr("r", 2)
            .attr("fill", "#ffeb3b");

        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height - 10)
            .attr("text-anchor", "middle")
            .attr("fill", "rgba(255,255,255,0.7)")
            .attr("font-size", "12px")
            .attr("font-family", "Overpass, sans-serif")
            .text("Drag the car to select year");

        vis.drag = d3.drag()
            .on("start", function(event) {
                d3.select(this).style("cursor", "grabbing");
                // Add some visual feedback
                vis.car.selectAll("rect")
                    .transition()
                    .duration(100)
                    .attr("fill", "#ff6b81");
            })
            .on("drag", function(event) {
                let x = Math.max(0, Math.min(vis.width, event.x));
                vis.car.attr("transform", `translate(${x - carWidth/2}, ${trackY - carHeight/2})`);

                let year = Math.round(vis.xScale.invert(x));
                if (year !== vis.selectedYear && year >= vis.yearRange[0] && year <= vis.yearRange[1]) {
                    vis.selectedYear = year;
                    vis._updateYearLabels();
                }
            })
            .on("end", function(event) {
                d3.select(this).style("cursor", "grab");
                vis.car.selectAll("rect")
                    .transition()
                    .duration(100)
                    .attr("fill", "#ff4757");

                let snappedX = vis.xScale(vis.selectedYear);
                vis.car.transition()
                    .duration(200)
                    .ease(d3.easeBackOut)
                    .attr("transform", `translate(${snappedX - carWidth/2}, ${trackY - carHeight/2})`);

                if (vis.onYearChange) {
                    vis.onYearChange(vis.selectedYear);
                }
            });

        vis.car.call(vis.drag);

        vis.updateVis();
    }

    _updateYearLabels() {
        let vis = this;
        vis.yearLabels
            .attr("fill", d => d === vis.selectedYear ? "#ffeb3b" : "#ccc")
            .attr("font-weight", d => d === vis.selectedYear ? "bold" : "normal");
    }

    wrangleData() {
        let vis = this;
        vis.updateVis();
    }

    updateVis() {
        let vis = this;
    }

    setYear(year) {
        let vis = this;
        if (year >= vis.yearRange[0] && year <= vis.yearRange[1]) {
            vis.selectedYear = year;
            let x = vis.xScale(year);
            const trackY = vis.height / 2;
            const carWidth = 36;
            const carHeight = 20;

            vis.car.attr("transform", `translate(${x - carWidth/2}, ${trackY - carHeight/2})`);
            vis._updateYearLabels();
        }
    }
}