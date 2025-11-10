class ZoomHandler {
    constructor(svgElement, zoomableGroup) {
        let vis = this;
        vis.svg = d3.select(svgElement);
        vis.zoomableGroup = zoomableGroup;

        vis.width = parseFloat(vis.svg.attr("width"));
        vis.height = parseFloat(vis.svg.attr("height"));

        vis.transform = d3.zoomIdentity;
        vis.isZoomed = false;

        vis.zoom = d3.zoom()
            .scaleExtent([0.5, 8])
            .translateExtent([[0, 0], [vis.width, vis.height]])
            .on("zoom", function (event) {
                vis.zoomed(event);
            });

        vis.svg.call(vis.zoom);

        vis.createZoomControls();
    }

    createZoomControls() {
        let vis = this;

        const parent = vis.svg.node().parentNode;
        vis.zoomControls = d3.select(parent).append("div")
            .attr("class", "zoom-controls")
            .style("position", "absolute")
            .style("bottom", "20px")
            .style("left", "20px")
            .style("z-index", "1000");

        vis.zoomControls.append("button")
            .attr("class", "zoom-btn zoom-in")
            .html("+")
            .style("display", "block")
            .style("width", "40px")
            .style("height", "40px")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .style("margin-bottom", "5px")
            .on("click", function () {
                vis.zoomIn();
            });

        vis.zoomControls.append("button")
            .attr("class", "zoom-btn zoom-out")
            .html("−")
            .style("display", "block")
            .style("width", "40px")
            .style("height", "40px")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .style("margin-bottom", "5px")
            .on("click", function () {
                vis.zoomOut();
            });

        vis.zoomControls.append("button")
            .attr("class", "zoom-btn zoom-reset")
            .html("⟲")
            .style("display", "block")
            .style("width", "40px")
            .style("height", "40px")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("font-size", "16px")
            .style("cursor", "pointer")
            .on("click", function () {
                vis.resetZoom();
            });
    }

    zoomed(event) {
        let vis = this;
        vis.transform = event.transform;
        vis.isZoomed = vis.transform.k !== 1;

        // Apply transform to the zoomable group
        vis.zoomableGroup.attr("transform", event.transform);
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
}