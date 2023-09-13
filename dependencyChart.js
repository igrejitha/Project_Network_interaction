google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(initializeDataAndDrawCharts);
var currentRotation = 0;

function drawGraph(nodes, links) {
    console.log("drawGraph has been called");
    console.log("drawGraph called: Nodes", nodes);
    console.log("drawGraph called: Links", links);

    // Find start and end nodes
    var startNode = nodes.find(node => node.ID === "0"); // Assuming ID is a string
    var endNode = nodes.reduce((a, b) => (a.ID > b.ID) ? a : b);
    console.log("End Node: ", endNode);

    // Find all paths from startNode to endNode
    console.log("Links array:", links);
    console.log("Links from start node:", links.filter(link => link.source === startNode || link.target === startNode));
    var paths = findAllPaths(startNode, endNode, links, nodes);
    console.log("All paths:", paths);


    // Create the SVG container
    var svg = d3.select("svg"),
        container = d3.select(".container"),
        dashboardCard = document.querySelector(".dashboard-card"),
        width = dashboardCard.clientWidth,
        height = dashboardCard.clientHeight;
    svg.attr("width", width).attr("height", height);


    console.log("SVG container: ", svg);
    console.log("Container: ", container);

    // Responsive Design
    window.addEventListener("resize", function () {
        var dashboardCard = document.querySelector(".dashboard-card");
        width = dashboardCard.clientWidth;
        height = dashboardCard.clientHeight;
        svg.attr("width", width).attr("height", height);
    });

    // Initialize in-degree to 0 for each node
    nodes.forEach(function (node) {
        node.inDegree = 0;
        node.outDegree = 0;  // New initialization for out-degree
    });


    // Calculate the in-degree for each node
    links.forEach(function (link) {
        var targetNode = nodes.find(function (node) { return node.ID === link.target; });
        targetNode.inDegree++;
    });

    // Calculate the out-degree for each node
    links.forEach(function (link) {
        var sourceNode = nodes.find(function (node) { return node.ID === link.source; });
        sourceNode.outDegree++;
    });

    // Calculate the degree for each node
    nodes.forEach(function (node) {
        node.degree = node.inDegree + node.outDegree;
    });

    // Filtering
    function updateNodeVisibility() {
        var inDegreeThreshold = parseInt(document.getElementById("filterSlider").value);
        var outDegreeThreshold = parseInt(document.getElementById("outDegreeFilterSlider").value);
        var degreeThreshold = parseInt(document.getElementById("degreeFilterSlider").value);

        node.style("visibility", function (d) {
            return (d.inDegree >= inDegreeThreshold && d.outDegree >= outDegreeThreshold && d.degree >= degreeThreshold) ? "visible" : "hidden";
        });
    }

    var filterSlider = document.getElementById("filterSlider");
    var filterValue = document.getElementById("filterValue");

    filterSlider.addEventListener("input", function () {
        var threshold = parseInt(this.value);
        filterValue.innerHTML = "> " + threshold;
        updateNodeVisibility(); // Use the unified function here
    });
    var outDegreeFilterSlider = document.getElementById("outDegreeFilterSlider");
    var outDegreeFilterValue = document.getElementById("outDegreeFilterValue");

    // Out-degree filter
    outDegreeFilterSlider.addEventListener("input", function () {
        var threshold = parseInt(this.value);
        outDegreeFilterValue.innerHTML = "> " + threshold;
        updateNodeVisibility(); // And here
    });

    var degreeFilterSlider = document.getElementById("degreeFilterSlider");
    var degreeFilterValue = document.getElementById("degreeFilterValue");

    // Degree filter (corrected)
    degreeFilterSlider.addEventListener("input", function () {
        var threshold = parseInt(this.value);
        degreeFilterValue.innerHTML = "> " + threshold;
        updateNodeVisibility(); // And here
    });


    // Search Functionality
    document.getElementById("searchInput").addEventListener("input", function () {
        var query = this.value.toLowerCase();
        node.attr("stroke", function (d) {
            return (d.Name.toLowerCase().includes(query) || d.ID === query) ? "red" : "none";
        });
    });

    window.rotate = function (angle) {
        currentRotation += angle;
        container.attr("transform", "rotate(" + currentRotation + "," + (width / 2) + "," + (height / 2) + ")");
    };


    // Zoom and pan behavior
    var zoom = d3.zoom().scaleExtent([0.1, 4])
        .translateExtent([[-width, -height], [2 * width, 3 * height]])
        .on("zoom", function () { container.attr("transform", d3.event.transform); });
    svg.call(zoom); // Change container to svg

    // Define zoom functions inside drawGraph
    window.zoomIn = function () {
        zoom.scaleBy(svg.transition().duration(750), 1.2);
    }

    window.zoomOut = function () {
        zoom.scaleBy(svg.transition().duration(750), 0.8);
    }

    window.pan = function (dx, dy) {
        var currentTransform = d3.zoomTransform(svg.node());
        var newX = currentTransform.x + dx;
        var newY = currentTransform.y + dy;

        zoom.transform(svg.transition().duration(750), d3.zoomIdentity.translate(newX, newY));
    };

    window.center = function () {
        let x = width / 2;
        let y = height / 2;
        zoom.translateTo(svg.transition().duration(750), x, y);
    }


    // Create the tooltip element
    var tooltip = d3.select("#graph-container").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Simulation setup
    var simulation = d3.forceSimulation(nodes)
        //.force("link", d3.forceLink(links).id(function (d) { return d.UID; })) //UID instead of ID
        //.force("link", d3.forceLink(links).id(function (d) { return d.ID; })) //ID instead of UID
        .force("link", d3.forceLink(links)
            .id(function (d) { return d.ID; }) //ID instead of UID
            .distance(function (d) { return d.duration; })) // Using 'duration' property for distance
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links (edges) with arrows
    var link = container.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");


    console.log("Link: ", link);

    link.on("mouseover", function (d) {
        // Highlight the link
        d3.select(this)
            .style("stroke", "white")
            .attr("stroke-width", 5);

        // Highlight the target node
        node.filter(n => n.ID === d.target.ID)
            .select("circle")
            .style("fill", "#113464");

        // Show tooltip with duration
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html("Duration: " + d.duration)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    })
        .on("mouseout", function (d) {
            // Restore the link color
            d3.select(this)
                .style("stroke", "#cdfaff")
                .attr("stroke-width", 2);

            // Restore the target node color
            node.filter(n => n.ID === d.target.ID)
                .select("circle")
                .style("fill", function (d) {
                    switch (true) {
                        case d.inDegree > 4: return "#41afeb";
                        case d.inDegree > 3: return "#46b9fa";
                        case d.inDegree > 2: return "#5ac8fa";
                        case d.inDegree > 1: return "#8ce6ff";
                        default: return "#b4f5ff";
                    }
                });

            // Hide tooltip
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Draw nodes
    var node = container.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g");

    // Append circles
    node.append("circle")
        .attr("class", "node")
        .style("stroke", "#1e69aa ")
        .attr("r", function (d) {
            return 20 + d.inDegree * 0.5; // Base radius is 10, and each additional link increases the radius by 5
        })
        .attr("fill", function (d) {
            switch (true) {
                case d.inDegree > 4: return "#41afeb";
                case d.inDegree > 3: return "#46b9fa";
                case d.inDegree > 2: return "#5ac8fa";
                case d.inDegree > 1: return "#8ce6ff";
                default: return "#b4f5ff";
            }
        })
        .on("mouseover", function (d) {
            // Check if user wants to highlight all connected nodes
            var highlightAllConnected = document.getElementById("highlightAllConnected").checked;
            var highlightCriticalPath = document.getElementById("highlightCriticalPath").checked;
            var highlightOutliers = document.getElementById("highlightOutliers").checked;

            d3.select(this)
                .interrupt()  // <-- interrupt any ongoing transitions
                .transition()
                .duration(200)
                .attr("r", 50)
                .style("stroke", "red")
                .style("stroke-width", "2px")
                .style("fill", "#0f0");

            // Find the corresponding text element and modify its style
            d3.select(this.parentNode) // go up to the group element (assuming your nodes and texts are wrapped inside a <g> element)
                .select("text") // select the text element
                .interrupt()  // <-- interrupt any ongoing transitions
                .transition()
                .duration(10)
                .style("font-size", "2em") // increase font size
                .style("fill", "red"); // change color to red

            var paths = [];
            if (highlightAllConnected) {
                var pathsFromStart = findAllPaths(startNode, d, links, nodes);
                var pathsToEnd = findAllPaths(d, endNode, links, nodes);
                var paths = [];

                pathsFromStart.forEach(pathFromStart => {
                    pathsToEnd.forEach(pathToEnd => {
                        paths.push(pathFromStart.concat(pathToEnd.slice(1))); // slice to avoid adding hovered node twice
                    });
                });
            }
            console.log("d Node: ", d);
            console.log("End Node: ", endNode);
            console.log("All Paths: ", paths);

            link.style("stroke", function (l) {
                if (highlightAllConnected) {
                    return paths.some(path => {
                        // Convert path array of nodes to array of IDs for easier comparison
                        const pathIDs = path.map(node => node.ID); // <-- 'path' should be the parameter of this function
                        return pathIDs.includes(l.source.ID) && pathIDs.includes(l.target.ID);
                    }) ? "yellow" : null;
                } else {
                    return (l.source === d || l.target === d) ? "yellow" : null;
                }
            }).attr("stroke-width", function (l) {
                if (highlightAllConnected) {
                    return paths.some(path => {
                        // Convert path array of nodes to array of IDs for easier comparison
                        const pathIDs = path.map(node => node.ID); // <-- 'path' should be the parameter of this function
                        return pathIDs.includes(l.source.ID) && pathIDs.includes(l.target.ID);
                    }) ? 4 : 2;
                } else {
                    return (l.source === d || l.target === d) ? 4 : 2;
                }
            });


            node.select("circle")
                .style("fill", function (n) {
                    var selectedMetric = document.querySelector('input[name="colorMetric"]:checked').value;
                    var metricValue;

                    switch (selectedMetric) {
                        case "inDegree":
                            metricValue = n.inDegree;
                            break;
                        case "outDegree":
                            metricValue = n.outDegree;
                            break;
                        case "degree":
                            metricValue = n.degree;
                            break;
                        default:
                            metricValue = n.inDegree; // default to in-degree if something goes wrong
                    }

                    var baseColor;
                    switch (true) {
                        case metricValue > 4: baseColor = "#41afeb"; break;
                        case metricValue > 3: baseColor = "#46b9fa"; break;
                        case metricValue > 2: baseColor = "#5ac8fa"; break;
                        case metricValue > 1: baseColor = "#8ce6ff"; break;
                        default: baseColor = "#b4f5ff";
                    }

                    if (highlightAllConnected) {
                        return paths.some(path => path.includes(n)) ? "yellow" : baseColor;
                    } else {
                        return (n === d || links.some(l => (l.source === d && l.target === n) || (l.target === d && l.source === n))) ? "yellow" : baseColor;
                    }
                })
                .attr("r", function (n) {
                    if (highlightAllConnected) {
                        return paths.some(path => path.includes(n)) ? 30 : d3.select(this).attr("r");
                    } else {
                        return (n === d || links.some(l => (l.source === d && l.target === n) || (l.target === d && l.source === n))) ? 30 : d3.select(this).attr("r");
                    }
                });


            if (highlightCriticalPath) {
                const criticalPath = findCriticalPath(paths, links);
                highlightPath(criticalPath.path, 'red', link, node); // Highlight the critical path in red
            }

            if (highlightOutliers) {
                const outlierPaths = findOutlierPaths(paths);
                outlierPaths.forEach(outlierPath => {
                    highlightPath(outlierPath, 'orange', link, node); // Highlight outlier paths in orange
                });
                highlightPath(criticalPath, 'red', link, node); // Highlight the critical path in red
            }

            var tooltipEndX = d3.select("#graph-container").node().getBoundingClientRect().right - 10; // 10px offset from right
            var tooltipEndY = d3.select("#graph-container").node().getBoundingClientRect().top + 10;  // 10px offset from top

            tooltip.style("right", "10px")
                .style("top", "10px");

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("<strong>ID:</strong> " + d.ID + "<br/>" +
                "<strong>Name:</strong> " + d.Name + "<br/>" +
                "<strong>Start:</strong> " + d.Start + "<br/>" +
                "<strong>Finish:</strong> " + d.Finish)
                .style("right", "10px")
                .style("top", "10px");
            //document.getElementById("infoPanel").innerHTML = "<strong>Name:</strong> " + d.Name + "<br/><strong>ID:</strong> " + d.ID + "<br/><strong>Start:</strong> " + d.Start + "<br/><strong>Finish:</strong> " + d.Finish + "<br/><strong>Duration:</strong> " + d.duration;

            // Draw arrow from node to tooltip
            //drawArrow(d, { x: tooltipEndX, y: tooltipEndY }, container);
            /* container.append("circle")
                .attr("cx", tooltipEndX)
                .attr("cy", tooltipEndY)
                .attr("r", 5)
                .style("fill", "red");
                */
        })
        .on("mouseout", function (d) {
            d3.select(this)
                .transition()
                .duration(500)
                .attr("r", 20 + d.inDegree * 0.5)
                .style("fill", function () {
                    switch (true) {
                        case d.inDegree > 4: return "#41afeb";
                        case d.inDegree > 3: return "#46b9fa";
                        case d.inDegree > 2: return "#5ac8fa";
                        case d.inDegree > 1: return "#8ce6ff";
                        default: return "#b4f5ff";
                    }
                })
                .style("stroke", null) // Remove the stroke (border) added during mouseover
                .style("stroke-width", "1px");;

            // Restore text element's style
            d3.select(this.parentNode)
                .select("text")
                .transition()
                .duration(300)
                .style("font-size", "12px")
                .style("fill", "#113464");

            // Restore link colors and width
            link.style("stroke", null)
                .attr("stroke-width", 2);

            // Restore other nodes
            node.select("circle")
                .style("stroke", "#1e69aa ")
                .style("fill", function (n) {
                    switch (true) {
                        case n.inDegree > 4: return "#41afeb";
                        case n.inDegree > 3: return "#46b9fa";
                        case n.inDegree > 2: return "#5ac8fa";
                        case n.inDegree > 1: return "#8ce6ff";
                        default: return "#b4f5ff";
                    }
                })
                .attr("r", function (n) {
                    return 20 + n.inDegree * 0.5;
                });
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            // Remove the arrow when the mouse leaves the node
            removeArrow(container);
        })
        .on("click", function (d) {
            alert("Task Details:\nName: " + d.Name + "\nID: " + d.ID + "\nStart: " + d.Start + "\nFinish: " + d.Finish);
        });

    // Append text labels
    node.append("text")
        .attr("dx", -15)
        .attr("dy", 5)
        .text(function (d) { return d.ID; })
        .style("fill", "#113464")
        .style("font-size", "14px");

    console.log("Node: ", node);

    node.transition()
        .duration(750)
        .style("fill", "blue");


    // Drag-and-Drop Editing
    var dragHandler = d3.drag()
        .on("start", function (d) {
            d3.select(this).raise().classed("active", true);
        })
        .on("drag", function (d) {
            d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
            // Update links if necessary
        })
        .on("end", function (d) {
            d3.select(this).classed("active", false);
        });

    dragHandler(node);


    // Simulation tick handler
    simulation.nodes(nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(links);

    // Simulation tick handler
    function ticked() {
        link.attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    angle = Math.atan2(dy, dx),
                    radius = 20 + d.target.inDegree * 0.5; // Calculate the dynamic radius based on in-degree
                return d.target.x - Math.cos(angle) * radius;
            })
            .attr("y2", function (d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    angle = Math.atan2(dy, dx),
                    radius = 20 + d.target.inDegree * 0.5; // Calculate the dynamic radius based on in-degree
                return d.target.y - Math.sin(angle) * radius;
            });

        node.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }
    document.getElementById("zoomSlider").addEventListener("input", function (e) {
        var zoomLevel = e.target.value / 100; // Adjust according to your needs

        zoom.scaleTo(svg.transition().duration(750), zoomLevel);
    });


    window.zoomExtents = function () {
        var xMin = d3.min(nodes, function (d) { return d.x; });
        var xMax = d3.max(nodes, function (d) { return d.x; });
        var yMin = d3.min(nodes, function (d) { return d.y; });
        var yMax = d3.max(nodes, function (d) { return d.y; });

        var xCenter = (xMin + xMax) / 2;
        var yCenter = (yMin + yMax) / 2;

        var scale = Math.min(width / (xMax - xMin), height / (yMax - yMin)) * 0.95; // 0.95 for padding
        var translate = [width / 2 - scale * xCenter, height / 2 - scale * yCenter];

        svg.transition().duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    };

    document.getElementById("highlightCriticalPath").addEventListener("change", function () {
        if (this.checked) {
            const criticalPathInfo = findCriticalPath(paths, links);
            highlightPath(criticalPathInfo.path, 'darkred', link, node, criticalPathInfo.duration);
            showTooltip(`Critical Path Length: ${criticalPathInfo.duration}`, 'darkred');
            // Update criticalPathDetails div with the path details
            document.getElementById('criticalPathDetails').textContent = `Critical Path Length: ${criticalPathInfo.duration}`;
        } else {
            clearHighlights();
            hideTooltip();
        }
    });

    document.getElementById("highlightOutliers").addEventListener("change", function () {
        if (this.checked) {
            const outlierPathsInfo = findOutlierPaths(paths, links);
            // Create a container to hold all the details content
            let detailsContent = '';
            // Create a container to hold all the tooltip content
            let tooltipContent = '';

            outlierPathsInfo.paths.forEach((outlierPath, index) => {
                const color = d3.scaleLinear().domain([0, outlierPathsInfo.paths.length - 1]).range(['orange', 'darkred'])(index);

                // Highlight the path and update the tooltip with the path duration
                highlightPath(outlierPath, color, link, node, outlierPathsInfo.durations[index]);
                // Add the path duration to the details content
                detailsContent += `Outlier Path ${index + 1} Length: ${outlierPathsInfo.durations[index]} units<br>`;
                // Add the path duration to the tooltip content
                // Wrap each tooltip line in a span with the appropriate color
                tooltipContent += `<span style="color:${color}">Outlier Path ${index + 1} Length: ${outlierPathsInfo.durations[index]} units</span><br>`;
            });

            const criticalPathInfo = findCriticalPath(paths, links);
            highlightPath(criticalPathInfo.path, 'darkred', link, node, criticalPathInfo.duration);
            //tooltipContent += `Critical Path Length: ${criticalPathInfo.duration} units`;
            tooltipContent += `<span style="color:darkred">Critical Path Length: ${criticalPathInfo.duration} units</span>`;

            // Display the combined tooltip content
            showTooltip(tooltipContent, 'darkred');

            // Update outlierPathsDetails div with the details content
            document.getElementById('outlierPathsDetails').innerHTML = detailsContent;
        } else {
            clearHighlights();
            hideTooltip();
        }
    });
    tasks = nodes.map(node => ({
        ID: node.ID,
        Name: node.Name,
        Start: node.Start,
        Finish: node.Finish,
        duration: node.duration, // Assuming you have a 'duration' property on each node
    }));
    drawCharts(nodes, links);       
}

function findAllPaths(startNode, endNode, links, nodes) {
    console.log("Finding paths from", startNode, "to", endNode);
    let paths = [];
    let stack = [[startNode]];
    i = 0;
    console.log("i:", i);

    // Log details about links and nodes
    console.log("Links at the start:", JSON.stringify(links));
    console.log("Nodes at the start:", JSON.stringify(nodes));

    while (stack.length > 0) {
        let path = stack.pop();
        let lastNode = path[path.length - 1];

        let neighbors = links
            .filter(link => (link.source.ID || link.source) === lastNode.ID)
            .map(link => nodes.find(node => node.ID === (link.target.ID || link.target)))
            .filter(neighbor => !path.includes(neighbor));

        console.log("Neighbors of", lastNode, ":", neighbors);

        for (let neighbor of neighbors) {
            let newPath = [...path, neighbor];
            console.log("New Path:", JSON.stringify(newPath));  // Logging the new path

            if (neighbor.ID === endNode.ID) {
                // Convert newPath to string and check if it's already in paths
                let newPathString = JSON.stringify(newPath.map(node => node.ID));
                if (!paths.some(path => JSON.stringify(path.map(node => node.ID)) === newPathString)) {
                    paths.push(newPath);
                }
            } else {
                stack.push(newPath);
            }
        }
        i = i + 1
        console.log("i++:", i);
    }

    console.log("All paths found:", paths);
    return paths;
}

function calculateSlack(nodes, links) {
    if (!nodes || !links || nodes.length === 0 || links.length === 0) {
        console.error("Invalid or empty nodes or links provided.");
        return;
    }
    console.log("calculateSlack entered", nodes, links)
    
    nodes.forEach(node => {
        node.ES = -1;
        node.EF = -1;
        node.LS = -1;
        node.LF = -1;
    });

    var startNode = nodes.find(node => node.ID === "0");
    if (!startNode) {
        console.error("Start node (ID: 0) not found.");
        return;
    }
    startNode.ES = 0;
    startNode.EF = 0;

    var endNode = nodes.reduce((a, b) => (a.ID > b.ID) ? a : b);
    console.log("calculateSlack start node", startNode)
    console.log("calculateSlack end node", endNode)
    
    let forwardPass = (node) => {
        let outgoingLinks = links.filter(link => link.source.ID === node.ID);
        for (let link of outgoingLinks) {
            let successor = nodes.find(n => n.ID === link.target.ID);
            if (!successor) {
                console.warn(`Successor not found for node ID: ${node.ID}`);
                continue;
            }
            if (isNaN(Number(successor.Duration))) {  // Corrected here
                console.warn(`Invalid duration for node ID: ${successor.ID}`);
                continue;
            }
            if (successor.ES === -1 || successor.ES < node.EF) {
                successor.ES = node.EF;
                successor.EF = successor.ES + Number(successor.Duration);  // And here
            }
            forwardPass(successor);
        }
    };
    forwardPass(startNode);
    
    if (!endNode || endNode.EF === -1) {
        console.error("End node not identified or has invalid EF.");
        return;
    }
    
    endNode.LF = endNode.EF;
    endNode.LS = endNode.LF;

    let backwardPass = (node) => {
        let incomingLinks = links.filter(link => link.target.ID === node.ID);
        for (let link of incomingLinks) {
            let predecessor = nodes.find(n => n.ID === link.source.ID);
            if (!predecessor) {
                console.warn(`Predecessor not found for node ID: ${node.ID}`);
                continue;
            }
            if (isNaN(Number(predecessor.Duration))) {  // Corrected here
                console.warn(`Invalid duration for node ID: ${predecessor.ID}`);
                continue;
            }
            if (predecessor.LF === -1 || predecessor.LF > node.LS) {
                predecessor.LF = node.LS;
                predecessor.LS = predecessor.LF - Number(predecessor.Duration);  // And here
            }
            backwardPass(predecessor);
        }
    };
    backwardPass(endNode);

    nodes.forEach(node => {
        node.ES = isNaN(node.ES) ? -1 : node.ES;
        node.EF = isNaN(node.EF) ? -1 : node.EF;
        node.LS = isNaN(node.LS) ? -1 : node.LS;
        node.LF = isNaN(node.LF) ? -1 : node.LF;
    });

    nodes.forEach(node => {
        node.slack = node.LS - node.ES;
    });

    let slackValues = {};
    nodes.forEach(node => {
        slackValues[node.ID] = node.slack;
    });
    console.log("slackValues", slackValues)
    return slackValues;
}


function computeEigenvectorCentrality(nodes, links, maxIterations) {
    console.log("Entered computeNetworkMetrics computeEigenvectorCentrality", nodes, links, maxIterations);
    let adjacencyMatrix = [];
    let eigenvectorValues = new Array(nodes.length).fill(1);

    nodes.forEach(node_i => {
        let row = [];
        nodes.forEach(node_j => {
            row.push(links.some(link =>
                (link.source.ID === node_i.ID && link.target.ID === node_j.ID) ||
                (link.source.ID === node_j.ID && link.target.ID === node_i.ID)
            ) ? 1 : 0);
        });
        adjacencyMatrix.push(row);
    });

    console.log("Entered computeNetworkMetrics EigenvectorCentrality1 Adjacency Matrix", adjacencyMatrix);

    for (let i = 0; i < maxIterations; i++) {
        console.log("Iteration:", i); // Added log
        let newEigenvectorValues = adjacencyMatrix.map((row, idx) => {
            return row.reduce((sum, val, j) => sum + val * eigenvectorValues[j], 0);
        });

        let norm = Math.sqrt(newEigenvectorValues.reduce((sum, val) => sum + val * val, 0));
        console.log("Norm:", norm); // Added log
        if (norm === 0) {
            console.error("Normalization error: Norm is zero.");
            return;
        }
        eigenvectorValues = newEigenvectorValues.map(val => val / norm);
    }

    console.log("Entered computeNetworkMetrics EigenvectorCentrality2", eigenvectorValues);

    nodes.forEach((node, idx) => {
        node.eigenvectorCentrality = eigenvectorValues[idx];
    });
    console.log("Exiting computeNetworkMetrics computeEigenvectorCentrality", eigenvectorValues);
    return new Map(nodes.map((node, idx) => [node.ID, eigenvectorValues[idx]]));
}


//Betweenness Centrality
function computeBetweennessCentrality(nodes, links) {
    console.log("Entered computeNetworkMetrics computeBetweennessCentrality", nodes, links);
    let betweenness = new Map();
    nodes.forEach(node => betweenness.set(node.ID, 0));

    for (let source of nodes) {
        let shortestPaths = new Map();
        nodes.forEach(node => shortestPaths.set(node.ID, []));
        shortestPaths.get(source.ID).push([source]);

        let queue = [source];
        let visited = new Set([source.ID]);

        while (queue.length) {
            let current = queue.shift();
            for (let link of links.filter(l => l.source.ID === current.ID)) {
                if (!visited.has(link.target.ID)) {
                    visited.add(link.target.ID);
                    queue.push(nodes.find(n => n.ID === link.target.ID));
                }
                let newPath = shortestPaths.get(current.ID).map(path => [...path, nodes.find(n => n.ID === link.target.ID)]);
                shortestPaths.get(link.target.ID).push(...newPath);
            }
        }

        nodes.forEach(node => {
            if (node !== source) {
                let pathsThroughNode = 0;
                let totalPaths = shortestPaths.get(node.ID).length;
                shortestPaths.get(node.ID).forEach(path => {
                    if (path.some(p => p.ID === node.ID) && path[0].ID === source.ID && path[path.length - 1].ID !== source.ID) {
                        pathsThroughNode += 1;
                    }
                });
                if (totalPaths !== 0) {
                    betweenness.set(node.ID, betweenness.get(node.ID) + pathsThroughNode / totalPaths);
                }
            }
        });
    }

    // Normalize the betweenness values
    let maxBetweenness = Math.max(...betweenness.values());
    if (maxBetweenness !== 0) {
        nodes.forEach(node => {
            betweenness.set(node.ID, betweenness.get(node.ID) / maxBetweenness);
            node.betweenness = betweenness.get(node.ID);
        });
    }
    console.log("Exiting computeNetworkMetrics computeBetweennessCentrality2", betweenness);
    return betweenness;
}

///Calculate Clustering Coefficient
function computeClusteringCoefficient(nodes, links) {
    console.log("Entered computeNetworkMetrics computeClusteringCoefficient", nodes, links);
    let clusteringCoefficients = new Map();

    for (let node of nodes) {
        let neighbors = links.filter(link => link.source.ID === node.ID || link.target.ID === node.ID)
            .map(link => link.source.ID === node.ID ? link.target.ID : link.source.ID);

        let neighborLinks = 0;
        for (let i = 0; i < neighbors.length; i++) {
            for (let j = i + 1; j < neighbors.length; j++) {
                if (links.some(link => (link.source.ID === neighbors[i] && link.target.ID === neighbors[j]) || (link.source.ID === neighbors[j] && link.target.ID === neighbors[i]))) {
                    neighborLinks++;
                }
            }
        }

        let totalPossibleLinks = neighbors.length * (neighbors.length - 1) / 2;
        //clusteringCoefficients.set(node.ID, totalPossibleLinks !== 0 ? neighborLinks / totalPossibleLinks : 0);
        clusteringCoefficients.set(node.ID, Math.min(Math.max(0, totalPossibleLinks !== 0 ? neighborLinks / totalPossibleLinks : 0), 1));
        node.clusteringCoefficient = clusteringCoefficients.get(node.ID);
    }
    console.log("Exit computeNetworkMetrics computeClusteringCoefficient", clusteringCoefficients);
    return clusteringCoefficients;
}

// Compute Network Density
function computeNetworkDensity(nodes, links) {
    let totalPossibleLinks = nodes.length * (nodes.length - 1) / 2;
    return links.length / totalPossibleLinks;
}

async function computeNetworkMetrics(nodes, links, dampingFactor, maxIterations) {
    console.log("Entered computeNetworkMetrics");

    // Compute PageRank
    console.log("Entered computeNetworkMetrics1 ", nodes, links, dampingFactor, maxIterations);
    let pageRankValues = await computePageRank(nodes, links, dampingFactor, maxIterations);
    console.log("Entered computeNetworkMetrics2");
    // Compute Betweenness Centrality
    let betweennessValues = computeBetweennessCentrality(nodes, links);
    console.log("Entered computeNetworkMetrics3");
    // Compute Clustering Coefficient
    let clusteringCoefficientValues = computeClusteringCoefficient(nodes, links);
    console.log("Entered computeNetworkMetrics4");
    // Compute Eigenvector Centrality
    let eigenvectorCentralityValues = computeEigenvectorCentrality(nodes, links, maxIterations);
    console.log("Entered computeNetworkMetrics5");
    // Compute Network Density
    let networkDensityValue = computeNetworkDensity(nodes, links);
    console.log("Entered computeNetworkMetrics6");
    // Find start and end nodes
    var startNode = nodes.find(node => node.ID === "0"); // Assuming ID is a string
    var endNode = nodes.reduce((a, b) => (a.ID > b.ID) ? a : b);

    // Find all paths from startNode to endNode
    var paths = findAllPaths(startNode, endNode, links, nodes);
    let criticalPathResult = findCriticalPath(paths, links);
    // Assuming you have paths and links available
    //const criticalPathData = findCriticalPath(paths, links);
    //const outlierPathsData = findOutlierPaths(paths, links);

    // Compute slacks for each node
    const nodeSlacks = calculateSlack(nodes, links);

    let criticalPath = criticalPathResult.path;  // Extract the path array
    let outlierPathsResult = findOutlierPaths(paths, links);
    let outlierPaths = outlierPathsResult.paths;  // Extract the paths array of arrays

    //populatePathsTable(criticalPathResult, outlierPathsResult);

    // Append metrics and labels to each node
    for (let node of nodes) {
        node.pageRank = pageRankValues.get(node.ID);
        node.betweenness = betweennessValues.get(node.ID);
        node.clusteringCoefficient = clusteringCoefficientValues.get(node.ID);
        node.eigenvectorCentrality = eigenvectorCentralityValues.get(node.ID);
        node.isOnCriticalPath = criticalPath.some(n => n.ID === node.ID); // Indicate if node is on critical path
        node.isOnOutlierPath = outlierPaths.some(path => path.includes(node));  // Indicate if node is on any outlier path
        // Append slack to the node
        node.slack = nodeSlacks[node.ID];
    }


    // Before the nodes.forEach loop, initialize arrays to collect raw values
    let taskInfluenceScores = [];
    let bufferRequirements = [];
    let flowDisruptionPotentials = [];
    let riskExposures = [];

    // Compute the scores for each node
    nodes.forEach(node => {
        // Extract metrics
        const CRITICAL_PATH_MULTIPLIER = 1.5;  // for nodes on the critical path
        const OUTLIER_PATH_MULTIPLIER = 1.25; // for nodes on the outlier paths
        const inDegree = node.inDegree;
        const outDegree = node.outDegree;
        const betweennessCentrality = node.betweenness;
        const pageRank = node.pageRank;
        // Duration will be taken from the link duration associated with the node,
        // but if not available, a default value of 1 will be taken.
        //const duration = links.find(link => link.source.ID === node.ID || link.target.ID === node.ID)?.duration || 1;
        const duration = node.Duration;
        console.log("computeNetworkMetrics Duration", node.ID)

        // Calculate raw metrics for each node
        const taskInfluenceScore = pageRank + betweennessCentrality;
        const bufferRequirement = 1 / (1 + Math.max(node.clusteringCoefficient, 0.001));
        const flowDisruptionPotential = 1 - node.clusteringCoefficient;
        const riskExposure = duration * betweennessCentrality;

        // Local normalization
        const normalize = (value, min, max) => {
            if (max === min) {
                console.warn("Normalization warning: max is equal to min for value:", value, ". Defaulting to 0.");
                return 0;  // Default value
            }
            return (value - min) / (max - min);
        };

        const handleNaN = (value, metricName, nodeId) => {
            if (isNaN(value)) {
                console.warn(`Warning: ${metricName} is NaN for node: ${nodeId}. Defaulting to 0.`);
                return 0; // Default value
            }
            return value;
        }

        const maxInDegree = Math.max(...nodes.map(n => n.inDegree));
        const minInDegree = Math.min(...nodes.map(n => n.inDegree));
        const inDegreeNorm = handleNaN(normalize(node.inDegree, minInDegree, maxInDegree), "inDegreeNorm", node.ID);

        const maxOutDegree = Math.max(...nodes.map(n => n.outDegree));
        const minOutDegree = Math.min(...nodes.map(n => n.outDegree));
        const outDegreeNorm = handleNaN(normalize(node.outDegree, minOutDegree, maxOutDegree), "outDegreeNorm", node.ID);

        const maxBetweenness = Math.max(...nodes.map(n => n.betweenness));
        const minBetweenness = Math.min(...nodes.map(n => n.betweenness));
        const betweennessCentralityNorm = handleNaN(normalize(node.betweenness, minBetweenness, maxBetweenness), "betweennessCentralityNorm", node.ID);

        const maxPageRank = Math.max(...nodes.map(n => n.pageRank));
        const minPageRank = Math.min(...nodes.map(n => n.pageRank));
        const pageRankNorm = handleNaN(normalize(node.pageRank, minPageRank, maxPageRank), "pageRankNorm", node.ID);

        const maxDuration = Math.max(...nodes.map(n => n.Duration));
        const minDuration = Math.min(...nodes.map(n => n.Duration));
        const durationNorm = normalize(node.Duration, minDuration, maxDuration);

        const maxClusteringCoefficient = Math.max(...nodes.map(n => n.clusteringCoefficient));
        const minClusteringCoefficient = Math.min(...nodes.map(n => n.clusteringCoefficient));
        const clusteringCoefficientNorm = normalize(node.clusteringCoefficient, minClusteringCoefficient, maxClusteringCoefficient);

        const minTaskInfluenceScore = Math.min(...taskInfluenceScores);
        const maxTaskInfluenceScore = Math.max(...taskInfluenceScores);
        const minBufferRequirement = Math.min(...bufferRequirements);
        const maxBufferRequirement = Math.max(...bufferRequirements);
        const minFlowDisruptionPotential = Math.min(...flowDisruptionPotentials);
        const maxFlowDisruptionPotential = Math.max(...flowDisruptionPotentials);
        const minRiskExposure = Math.min(...riskExposures);
        const maxRiskExposure = Math.max(...riskExposures);

        const taskInfluenceScoreNorm = normalize(taskInfluenceScore, minTaskInfluenceScore, maxTaskInfluenceScore);
        const bufferRequirementNorm = normalize(bufferRequirement, minBufferRequirement, maxBufferRequirement);
        const flowDisruptionPotentialNorm = normalize(flowDisruptionPotential, minFlowDisruptionPotential, maxFlowDisruptionPotential);
        //const riskExposureNorm = normalize(riskExposure, minRiskExposure, maxRiskExposure);
        const riskExposureNorm = handleNaN(normalize(riskExposure, minRiskExposure, maxRiskExposure), "riskExposureNorm", node.ID);


        const dependencyRatio = (inDegree + outDegree) !== 0 ? inDegree / (inDegree + outDegree) : 0;
        const maxDependencyRatio = Math.max(...nodes.map(n => {
            const inD = n.inDegree;
            const outD = n.outDegree;
            return (inD + outD) !== 0 ? inD / (inD + outD) : 0;
        }));
        const minDependencyRatio = Math.min(...nodes.map(n => {
            const inD = n.inDegree;
            const outD = n.outDegree;
            return (inD + outD) !== 0 ? inD / (inD + outD) : 0;
        }));
        const dependencyRatioNorm = normalize(dependencyRatio, minDependencyRatio, maxDependencyRatio);

        const bottleneckScore = (inDegree + outDegree) / (duration);
        const maxBottleneckScore = Math.max(...nodes.map(n => {
            const dur = n.Duration !== 0 ? n.Duration : 1; // prevent division by zero
            return (n.inDegree + n.outDegree) / dur;
        }));
        const minBottleneckScore = Math.min(...nodes.map(n => {
            const dur = n.Duration !== 0 ? n.Duration : 1; // prevent division by zero
            return (n.inDegree + n.outDegree) / dur;
        }));
        const bottleneckScoreNorm = normalize(bottleneckScore, minBottleneckScore, maxBottleneckScore);


        // Calculate other metrics
        //const riskExposure = duration * betweennessCentrality;
        const EPSILON = 0.001; // a small value to avoid division by zero or near-zero values
        const adjustedClusteringCoefficient = Math.max(node.clusteringCoefficient, -1 + EPSILON);

        // Compute Risk Score
        const riskScore = (0.15 * inDegreeNorm) +
            (0.15 * outDegreeNorm) +
            (0.25 * betweennessCentralityNorm) +
            (0.1 * durationNorm) +
            (0.15 * riskExposureNorm) +
            (0.2 * pageRank);

        // Compute Importance Score
        //const taskInfluenceScore = pageRank + betweennessCentrality; // Simplified for the example
        //const bufferRequirement = 1 / (1 + adjustedClusteringCoefficient);
        //const flowDisruptionPotential = 1 - node.clusteringCoefficient; // A simplified approach

        const importanceScore = (0.15 * dependencyRatioNorm) +
            (0.25 * taskInfluenceScore) +
            (0.15 * bufferRequirement) +
            (0.05 * flowDisruptionPotential) +
            (0.15 * bottleneckScoreNorm) +
            (0.2 * pageRank);
        console.log("computeNetworkMetrics Final Importance Score for node", node.ID, ":", importanceScore);

        // Adjust multipliers based on node's presence on critical or outlier paths
        let riskMultiplier = 1;
        let importanceMultiplier = 1;

        if (node.isOnCriticalPath && node.isOnOutlierPath) {
            riskMultiplier = Math.max(CRITICAL_PATH_MULTIPLIER, OUTLIER_PATH_MULTIPLIER);
            importanceMultiplier = CRITICAL_PATH_MULTIPLIER; // We only apply the critical path multiplier for importance
        } else if (node.isOnCriticalPath) {
            riskMultiplier = CRITICAL_PATH_MULTIPLIER;
            importanceMultiplier = CRITICAL_PATH_MULTIPLIER;
        } else if (node.isOnOutlierPath) {
            riskMultiplier = OUTLIER_PATH_MULTIPLIER;
        }

        // Compute Risk and Importance Score with the adjusted multipliers
        node.riskScore = riskScore * riskMultiplier;
        node.importanceScore = importanceScore * importanceMultiplier;

        // Check if riskScore or importanceScore are NaN and set them to 0
        if (isNaN(node.riskScore)) {
            console.error("NaN detected for riskScore on node:", node.ID);
            node.riskScore = 0.0001;
        }
        if (isNaN(node.importanceScore)) {
            console.error("NaN detected for importanceScore on node:", node.ID);
            node.importanceScore = 0.0001;
        }
    });
    // Dummy totalProjectOverrunProbability
    const totalProjectOverrunProbability = 0.2;  // Example value
    // Call the function
    const updatedNodes = distributeOverrunProbability(nodes, links, totalProjectOverrunProbability);
    console.log("computeNetworkMetrics7, updatedNodes", nodes);

    console.log("Exiting computeNetworkMetrics nodes", nodes, networkDensityValue);

    // Return updated nodes and network density value
    return {
        updatedNodes: nodes,
        networkDensity: networkDensityValue
    };
}

function computePageRank(nodes, links, dampingFactor, maxIterations) {
    let pageRankValues = new Map();
    let newPageRankValues = new Map();

    for (let node of nodes) {
        pageRankValues.set(String(node.ID), 1 / nodes.length);
    }

    console.log("Initial PageRank values:", pageRankValues);

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
        let totalDifference = 0;

        // Identify dangling nodes
        let danglingNodes = [...pageRankValues.keys()].filter(key =>
            !links.some(link => key === String(link.source.ID) || key === String(link.target.ID))
        );
        console.log(`Number of Dangling Nodes: ${danglingNodes.length}`);

        for (let node of nodes) {
            let nodeID = String(node.ID);
            newPageRankValues.set(nodeID, (1 - dampingFactor) / nodes.length);

            for (let link of links) {
                if (nodeID === String(link.target.ID)) {
                    let outgoingLinks = links.filter(l => String(l.source.ID) === String(link.source.ID));
                    let totalWeight = outgoingLinks.reduce((acc, l) => acc + l.duration, 0);

                    // Diagnostic: Average Link Weight
                    let avgWeight = totalWeight / outgoingLinks.length;
                    console.log(`Average Link Weight for Node ${nodeID}: ${avgWeight}`);

                    newPageRankValues.set(nodeID, newPageRankValues.get(nodeID) + dampingFactor * (pageRankValues.get(String(link.source.ID)) * link.duration / totalWeight));
                }
            }
        }

        // Calculate total difference
        for (let [nodeID, value] of newPageRankValues) {
            totalDifference += Math.abs(value - pageRankValues.get(nodeID));
        }

        console.log(`Total Difference for Iteration ${iteration}: ${totalDifference}`);

        // Swap the new values into the old PageRank values for the next iteration
        [pageRankValues, newPageRankValues] = [newPageRankValues, pageRankValues];
    }

    console.log("Final PageRank values:", pageRankValues);
    return pageRankValues;
}


function enhanceWeightsWithCriticalPathAndOutliers(links, criticalPathSet, outlierTasksSet, criticalPathMultiplier, outlierMultiplier) {
    for (let link of links) {
        if (criticalPathSet.has(link.source.ID)) {
            link.duration *= criticalPathMultiplier;
        } else if (outlierTasksSet.has(link.source.ID)) {
            link.duration *= outlierMultiplier;
        }
    }
}

function distributeOverrunProbability(nodes, links, totalProjectOverrunProbability) {
    console.log("distributeOverrunProbability: Entry");
    if (!nodes || !links) {
        console.error("distributeOverrunProbability: Missing nodes or links.");
        return;
    }

    nodes.forEach(node => {
        node.overrun_probability = 0;
        if (node.Duration <= 0) {
            console.warn(`Node ID ${node.ID} has invalid Duration: ${node.Duration}. Setting to a default value of 1.`);
            node.Duration = 1; // Set to a default value of 1 or any other suitable value
        }
    });

    const startNode = nodes.find(node => node.ID === "0");
    const endNode = nodes.reduce((a, b) => (a.ID > b.ID) ? a : b);

    console.log("distributeOverrunProbability: Initial Nodes:", nodes);
    let allPaths = findAllPaths(startNode, endNode, links, nodes);
    console.log("distributeOverrunProbability: All Paths:", allPaths);

    let criticalPathInfo = findCriticalPath(allPaths, links);
    console.log("distributeOverrunProbability: Initial Critical Path Info:", criticalPathInfo);

    let targetDuration = criticalPathInfo.duration * (1 + totalProjectOverrunProbability);
    let currentLongestDuration = criticalPathInfo.duration;

    // Convergence and iteration control
    let iterationCount = 0;
    const MAX_ITERATIONS = 1000;
    const EPSILON = 1e-6;
    let previousDifference = Infinity;
    while (iterationCount < MAX_ITERATIONS) {
        allPaths.forEach(path => {
            distributeOverrunForPath(path, nodes, links, totalProjectOverrunProbability);
            const originalPathLength = path.reduce((sum, node) => sum + parseFloat(node.Duration), 0);
            const adjustedPathLength = path.reduce((sum, node) => sum + parseFloat(node.Duration) * (1 + node.overrun_probability), 0);
            console.log("distributeOverrunProbability: probalilityyyyyyyyyyyy", originalPathLength, adjustedPathLength);
            path.forEach(node => {
                console.log("distributeOverrunProbability: probalility", node.Duration, node.overrun_probability);
            });                  
            if (adjustedPathLength < originalPathLength) {
                console.warn(`Adjusted path length ${adjustedPathLength} is less than original path length ${originalPathLength} for path:`, path);
            }
        });

        let updatedCriticalPathInfo = findCriticalPath(allPaths, links);
        console.log("distributeOverrunProbability: Updated Critical Path Info:", updatedCriticalPathInfo);

        currentLongestDuration = updatedCriticalPathInfo.duration;
        
        let currentDifference = Math.abs(currentLongestDuration - targetDuration);
        if (currentDifference < EPSILON || Math.abs(currentDifference - previousDifference) < EPSILON) {
            break;
        }
        
        previousDifference = currentDifference;
        iterationCount++;

        console.log("distributeOverrunProbability: Iteration:", iterationCount, "Current Longest Duration:", currentLongestDuration, "Target Duration:", targetDuration);
    }
    if (iterationCount >= MAX_ITERATIONS) {
        console.warn("Max iterations reached. Results might not be fully converged.");
    }

    allPaths.forEach(path => {
        const originalPathLength = path.reduce((sum, node) => sum + parseFloat(node.Duration), 0);
        const adjustedPathLength = path.reduce((sum, node) => sum + parseFloat(node.Duration) * (1 + node.overrun_probability), 0);
        
        console.log("distributeOverrunProbability: Path:", path, "Original Length:", originalPathLength, "Adjusted Length:", adjustedPathLength);

        if (adjustedPathLength < originalPathLength) {
            console.warn(`Adjusted path length ${adjustedPathLength} is less than original path length ${originalPathLength} for path:`, path);
        }
    });

    return nodes;
}


function distributeOverrunForPath(path, nodes, links, totalProjectOverrunProbability) {
    let totalPathWeight = path.reduce((sum, node) => {
        let risk = parseFloat(node.riskScore);
        let importance = parseFloat(node.importanceScore);
        if (isNaN(risk) || isNaN(importance)) {
            console.warn(`Node ID ${node.ID} has invalid risk or importance: ${node.riskScore}, ${node.importanceScore}`);
            return sum;
        }
        return sum + (risk * importance);
    }, 0);

    if (totalPathWeight === 0) {
        console.warn("Total path weight is 0 for path:", path);
        return;
    }

    console.log("distributeOverrunProbability: Total Path Weight:", totalPathWeight);
    for (let node of path) {
        let risk = parseFloat(node.riskScore);
        let importance = parseFloat(node.importanceScore);
        let duration = parseFloat(node.Duration);

        if (isNaN(risk) || isNaN(importance) || isNaN(duration)) {
            console.warn(`Node ID ${node.ID} has invalid values. Risk: ${node.riskScore}, Importance: ${node.importanceScore}, Duration: ${node.Duration}`);
            node.overrun_probability = 0;
            continue;
        }

        // Calculate node overrun probability ensuring it's never negative
        let nodeWeight = risk * importance;
        let probability = (nodeWeight / totalPathWeight) * totalProjectOverrunProbability;
        node.overrun_probability = Math.min(1, Math.max(0, probability));

        // Ensure the overrun probability is never such that the adjusted duration is less than the original duration
        const adjustedDuration = parseFloat(node.Duration) * (1 + node.overrun_probability);
        console.log("distributeOverrunProbability: Node:", node.ID, "Duration:", node.Duration, "Overrun Probability:", node.overrun_probability, "Adjusted Duration:", adjustedDuration);

        if (adjustedDuration < parseFloat(node.Duration)) {
            node.overrun_probability = 0;
            console.warn(`Adjusted duration ${adjustedDuration} is less than original duration ${node.Duration} for Node ID ${node.ID}. Setting overrun_probability to 0.`);
        }         
        if (isNaN(node.overrun_probability) || !isFinite(node.overrun_probability)) {
            console.warn(`Invalid overrun_probability for Node ID ${node.ID}. Setting to 0.`);
            node.overrun_probability = 0;
        }
    }
}

function generatePathsTable(nodes, links) {
    // Assuming paths and links are available
    console.log("generatePathsTable", nodes, links)
    const startNode = nodes.find(node => node.ID === "0");
    const endNode = nodes.reduce((a, b) => (a.ID > b.ID) ? a : b);
    const allPaths = findAllPaths(startNode, endNode, links, nodes);
    const criticalPathData = findCriticalPath(allPaths, links);
    const outlierPathsData = findOutlierPaths(allPaths, links);

    // Start generating table
    let tableHTML = '<table border="1">';

    // Table header
    tableHTML += '<tr>';
    tableHTML += '<th>Path Name</th>';
    tableHTML += '<th>Original Duration</th>';
    tableHTML += '<th>Risk Adjusted Duration</th>';

    const maxActivities = Math.max(criticalPathData.path.length, ...outlierPathsData.paths.map(p => p.length));
    for (let i = 1; i <= maxActivities; i++) {
        tableHTML += `<th>Activity ${i}</th>`;
    }

    tableHTML += '</tr>';

    // Critical path data row
    tableHTML += '<tr>';
    tableHTML += '<td>Critical Path</td>';
    tableHTML += `<td>${criticalPathData.duration}</td>`;
    tableHTML += `<td>${Math.round(calculateExpectedOverrunDurationForPath(criticalPathData.path))}</td>`;
    criticalPathData.path.forEach(node => {
        tableHTML += `<td style="color:red;">${node.ID}</td>`;
    });
    for (let i = criticalPathData.path.length; i < maxActivities; i++) {
        tableHTML += '<td style="color:#41afeb;">N/A</td>';
    }
    tableHTML += '</tr>';

    // Sort the outlier paths by their duration
    const sortedOutlierPaths = outlierPathsData.paths.map((path, index) => ({
        path,
        duration: outlierPathsData.durations[index]
    })).sort((a, b) => a.duration - b.duration);

    // Outlier paths data rows
    sortedOutlierPaths.forEach(({path, duration}, index) => {
        // Scale the color based on index
        const color = d3.scaleLinear()
                        .domain([0, sortedOutlierPaths.length - 1])
                        .range(['orange', 'red'])(index);
        console.log("colorissue", color, duration, criticalPathData.duration);
        tableHTML += '<tr>';
        tableHTML += `<td>Outlier Path ${index + 1}</td>`;
        tableHTML += `<td>${duration}</td>`;
        tableHTML += `<td>${Math.round(calculateExpectedOverrunDurationForPath(path))}</td>`;
        path.forEach(node => {
            tableHTML += `<td style="color:${color} !important;">${node.ID}</td>`;
        });
        for (let i = path.length; i < maxActivities; i++) {
            tableHTML += '<td style="color:#41afeb;">N/A</td>';
        }
        tableHTML += '</tr>';
    });

    tableHTML += '</table>';

    // Insert the table into the DOM
    document.getElementById("pathsDistributionTableBody").innerHTML = tableHTML;
    // 3. Make the table sortable
    makeTableSortable(document.getElementById("pathsDistributionTableBody"));
}

function makeTableSortable(table) {
    // Simple function to sort table rows based on a column
    // This is a basic implementation and might need adjustments based on the table structure
    const headers = table.querySelectorAll('th');
    headers.forEach((header, idx) => {
        header.addEventListener('click', () => {
            const sortedRows = Array.from(table.rows)
                .slice(1)  // Skip the header row
                .sort((rowA, rowB) => {
                    const cellA = rowA.cells[idx].textContent;
                    const cellB = rowB.cells[idx].textContent;
                    return cellA.localeCompare(cellB, undefined, { numeric: true });
                });
            table.tBodies[0].append(...sortedRows);
        });
    });
}

function calculateExpectedOverrunDurationForPath(path) {
    return path.reduce((sum, node) => {
        const adjustedDuration = node.Duration * (1 + node.overrun_probability);
        return sum + Math.max(adjustedDuration, node.Duration);
    }, 0);
}

function constructNetworkUsingPageRankWithDurationsCriticalPathAndOutliers(nodes, links) {
    const dampingFactor = 0.85;
    const convergenceThreshold = 1e-6;
    const maxIterations = 100;
    const criticalPathMultiplier = 2;
    const outlierMultiplier = 1.5;  // Adjust as needed

    let criticalPathSet = new Set(nodes.filter(node => node.isOnCriticalPath).map(node => node.ID));
    let outlierTasksSet = new Set(nodes.filter(node => node.isOnOutlierPath).map(node => node.ID));

    let pageRankValues = {};
    nodes.forEach(node => pageRankValues[node.ID] = 1 / nodes.length);

    // Adjust weighting based on whether a node is part of an outlier path
    for (let link of links) {
        if (outlierTasksSet.has(link.source.ID)) {
            link.weight = link.weight ? link.weight * outlierMultiplier : outlierMultiplier;
        }
    }

    for (let i = 0; i < maxIterations; i++) {
        let newPageRankValues = {};
        for (let node of nodes) {
            newPageRankValues[node.ID] = (1 - dampingFactor) / nodes.length;
            for (let link of links) {
                if (link.target === node.ID) {
                    let totalWeight = links.filter(l => l.source === link.source).reduce((acc, l) => acc + l.duration, 0);
                    let weight = link.duration;

                    if (criticalPathSet.has(link.source.ID)) {
                        weight *= criticalPathMultiplier;
                    } else if (outlierTasksSet.has(link.source.ID)) {
                        weight *= outlierMultiplier;
                    }

                    newPageRankValues[node.ID] += dampingFactor * (pageRankValues[link.source] * weight / totalWeight);
                }
            }
        }

        let diff = 0;
        for (let node of nodes) {
            diff += Math.abs(newPageRankValues[node.ID] - pageRankValues[node.ID]);
        }
        if (diff < convergenceThreshold) {
            break;
        }

        pageRankValues = newPageRankValues;
    }

    nodes.sort((a, b) => pageRankValues[b.ID] - pageRankValues[a.ID]);
    let topNodesCount = Math.floor(0.1 * nodes.length);
    let topNodes = nodes.slice(0, topNodesCount);

    // Ensure Start Milestone and End Milestone are present
    const startMilestone = nodes.find(node => node.ID === '0');
    const endMilestone = nodes.find(node => node.ID === nodes[nodes.length - 1].ID);

    if (!topNodes.includes(startMilestone)) {
        topNodes.push(startMilestone);
    }
    if (!topNodes.includes(endMilestone)) {
        topNodes.push(endMilestone);
    }

    // Ensure all nodes (except Start and End Milestone) have at least one predecessor and one successor
    let filteredLinks = links.filter(link => {
        if (link.source === startMilestone || link.target === endMilestone) return true;
        return links.some(l => l.target === link.source) && links.some(l => l.source === link.target);
    });

    let newLinks = links.filter(link => topNodes.includes(link.source) || topNodes.includes(link.target));
    let newNodes = [...new Set(newLinks.map(link => link.source).concat(newLinks.map(link => link.target)))];

    console.log("startMilestone: ", startMilestone, "endMilestone: ", endMilestone)

    console.log("The function constructNetworkUsingPageRankWithDurationsCriticalPathAndOutliers returns", "nodes1: ", newNodes, "links: ", newLinks, "criticalPathSet: ", criticalPathSet, "outlierTasksSet: ", outlierTasksSet)
    return {
        nodes: newNodes,
        links: newLinks,
        criticalPathSet: criticalPathSet,
        outlierTasksSet: outlierTasksSet
    };
}

function drawReducedGraphWithVis(nodes, links) {
    console.log("drawReducedGraphWithVis", "nodes: ", nodes, "links: ", links);

    const container = document.getElementById('dependency_chart');
    const configContainer = document.getElementById('configuration-container');


    // Side panel for node information
    const infoPanel = document.getElementById('info-panel');

    // Pan and Centering Controls
    const controlsDiv = document.createElement('div');
    controlsDiv.style.textAlign = 'center';
    controlsDiv.style.padding = '10px';
    controlsDiv.style.backgroundColor = '#f5f5f5'; // Light gray background for better visibility

    const btnLeft = document.createElement('button');
    btnLeft.textContent = '←';
    controlsDiv.appendChild(btnLeft);

    const btnUp = document.createElement('button');
    btnUp.textContent = '↑';
    controlsDiv.appendChild(btnUp);

    const btnDown = document.createElement('button');
    btnDown.textContent = '↓';
    controlsDiv.appendChild(btnDown);

    const btnRight = document.createElement('button');
    btnRight.textContent = '→';
    controlsDiv.appendChild(btnRight);

    const btnCenter = document.createElement('button');
    btnCenter.textContent = 'Center';
    controlsDiv.appendChild(btnCenter);

    container.appendChild(controlsDiv);

    const clusterByHubSizeButton = document.createElement('button');
    clusterByHubSizeButton.textContent = 'Cluster by Hub Size';
    controlsDiv.appendChild(clusterByHubSizeButton);

    const clusterByAttributeButton = document.createElement('button');
    clusterByAttributeButton.textContent = 'Cluster by Attribute';
    controlsDiv.appendChild(clusterByAttributeButton);

    const declusterButton = document.createElement('button');
    declusterButton.textContent = 'De-cluster';
    controlsDiv.appendChild(declusterButton);

    // Search functionality
    const searchInput = document.createElement('input');
    searchInput.setAttribute('placeholder', 'Search for a node...');
    searchInput.addEventListener('input', function () {
        const query = this.value;
        const nodeToFocus = nodes.find(node => node.ID === query || node.Name.includes(query));
        if (nodeToFocus) {
            network.focus(nodeToFocus.ID, {
                scale: 1.5,
                animation: {
                    duration: 500,
                    easingFunction: "easeInOutQuad"
                }
            });
        }
    });
    container.appendChild(searchInput);

    // Modify nodes based on their degree
    nodes.forEach(node => {
        if (node.degree > 4) {
            node.color = { background: 'red' };
        } else {
            node.color = { background: 'blue' };
        }
    });

    // Modify edges based on their length
    links.forEach(edge => {
        edge.label = `Duration: ${edge.length / 20}`;
    });

    // Prepare the data
    const data = {
        nodes: new vis.DataSet(nodes.map(node => ({
            id: node.ID,
            label: node.ID,
            title: `<strong>ID:</strong> ${node.ID}<br><strong>Name:</strong> ${node.Name}`,  // enhanced tooltip
            value: node.degree, // use degree for node size
            color: node.degree > 2 ? "#46b9fa" : "#8ce6ff",  // dynamic coloring based on degree
            font: {
                color: "#ffffff",
                size: 24
            }
        }))),
        edges: new vis.DataSet(links.map(link => ({
            from: link.source.ID,  // use the ID attribute of the source node
            to: link.target.ID,    // use the ID attribute of the target node
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 1.5
                }
            },
            color: {
                color: "#a3d1ff",
                opacity: 0.8,
                inherit: 'from'
            },
            length: link.duration * 20,
            hiddenLabel: `Duration: ${isNaN(link.duration) ? 0 : link.duration}`,
            font: { color: 'transparent' }  // hide the label initially
        })))

    };

    // Configure the options
    const options = {
        nodes: {
            shape: "circle",
            borderWidth: 3,
            borderWidthSelected: 5,
            scaling: {
                min: 20,
                max: 100
            },
            chosen: {
                node: function (values, id, selected, hovering) {
                    if (hovering) {
                        values.color = '#ffa3a3';  // Color when hovering over the node
                    } else if (selected) {
                        values.color = '#ff0000';  // Color when the node is selected
                    } else {
                        values.color = values.originalColor || "#5ac8fa";  // Default color
                    }
                }
            },
        },
        edges: {
            width: 2.5,
            smooth: {
                type: "dynamic"
            },
            font: {
                size: 12,
                align: 'middle'
            },
            chosen: {
                edge: function (values, id, selected, hovering) {
                    values.color = selected ? '#ff0000' : '#a3d1ff';
                    values.font.color = hovering ? '#000000' : 'transparent'; // Show label on hover
                }
            }
        },
        interaction: {
            hover: true,
            hoverConnectedEdges: true,
            selectConnectedEdges: true
        },
        // Physics tweaking options
        physics: {
            maxVelocity: 50,
            minVelocity: 0.1,
            solver: 'barnesHut',
            barnesHut: {
                gravitationalConstant: -3000,
                centralGravity: 0.5
            },
            stabilization: {
                iterations: 2500
            }
        },
        configure: {
            enabled: true,              // Enable or disable the panel
            filter: true,               // The filter function or boolean to determine which options are shown
            container: configContainer,       // The DOM element where the configuration UI will be created; if not provided, it will be next to the network.
            showButton: true            // Show or hide the generate options button
        }
    };


    // Initialize the network
    const network = new vis.Network(container, data, options);

    // Cluster by hub size
    clusterByHubSizeButton.addEventListener('click', function () {
        network.clusterByHubsize(undefined, {
            clusterNodeProperties: {
                shape: 'box',
                size: 30,
                color: '#FF9999',
                borderWidth: 3,
                borderWidthSelected: 5,
                label: 'Cluster'
            }
        });
    });

    // Cluster by attribute (for this example, we're clustering nodes with similar degrees)
    clusterByAttributeButton.addEventListener('click', function () {
        const clusterOptionsByData = {
            joinCondition: function (childOptions) {
                return childOptions.degree > 2;
            },
            clusterNodeProperties: {
                id: 'degreeCluster',
                borderWidth: 3,
                shape: 'star',
                size: 40,
                color: '#FFFF00',
                label: 'Nodes with high degree'
            }
        };
        network.cluster(clusterOptionsByData);
    });

    // De-cluster
    declusterButton.addEventListener('click', function () {
        network.openCluster('degreeCluster');
    });

    // Attach event listeners for the controls
    btnLeft.addEventListener('click', function () {
        const currentPosition = network.getViewPosition();
        network.moveTo({
            position: { x: currentPosition.x + 100, y: currentPosition.y },
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    btnUp.addEventListener('click', function () {
        const currentPosition = network.getViewPosition();
        network.moveTo({
            position: { x: currentPosition.x, y: currentPosition.y + 100 },
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    btnRight.addEventListener('click', function () {
        const currentPosition = network.getViewPosition();
        network.moveTo({
            position: { x: currentPosition.x - 100, y: currentPosition.y },
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    btnDown.addEventListener('click', function () {
        const currentPosition = network.getViewPosition();
        network.moveTo({
            position: { x: currentPosition.x, y: currentPosition.y - 100 },
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    btnCenter.addEventListener('click', function () {
        network.fit({
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    // Focus on a node and its direct neighbors when the node is clicked
    network.on("click", function (properties) {
        const selectedNodeId = properties.nodes[0];
        if (selectedNodeId) {
            const selectedNode = nodes.find(node => node.ID === selectedNodeId);
            infoPanel.innerHTML = `
            <h3>Node Details</h3>
            <p><strong>ID:</strong> ${selectedNode.ID}</p>
            <p><strong>Name:</strong> ${selectedNode.Name}</p>
            <p><strong>Degree:</strong> ${selectedNode.degree}</p>
        `;
        } else {
            infoPanel.innerHTML = '';
        }
    });
    // Node Dragging Enhancements
    network.on("dragEnd", function (params) {
        if (params.nodes.length) {
            const draggedNode = data.nodes.get(params.nodes[0]);
            draggedNode.fixed = {
                x: true,
                y: true
            };
            data.nodes.update(draggedNode);
        }
    });

    // List activities sorted by ID
    const sortedNodes = nodes.sort((a, b) => a.ID - b.ID);
    const activityList = document.createElement("ul");
    sortedNodes.forEach(node => {
        const listItem = document.createElement("li");
        listItem.textContent = node.ID + ": " + node.Name;
        activityList.appendChild(listItem);
    });

    // Append the list to the path-list container
    document.getElementById("path-list").appendChild(activityList);

    // Hover enhancements
    network.on("hoverNode", function (properties) {
        const hoveredNode = nodes.find(node => node.ID === properties.node);
        const tooltipContent = `
        <strong>ID:</strong> ${hoveredNode.ID}<br>
        <strong>Name:</strong> ${hoveredNode.Name}
    `;
        // Display this content in a tooltip. (Implementation depends on your tooltip library)
    });

    // Legend (this is a simple example, you'll want to make it more dynamic)
    const legend = document.createElement('div');
    legend.style.marginTop = "20px";
    legend.innerHTML = `
            <strong>Legend:</strong><br>
            <span style="display:inline-block; width:12px; height:12px; background-color:red;"></span> High Degree Node<br>
            <span style="display:inline-block; width:12px; height:12px; background-color:blue;"></span> Low Degree Node<br>
            <span style="display:inline-block; width:20px; height:2px; background-color:#a3d1ff;"></span> Link (Hover for duration)
        `;
    container.appendChild(legend);
}
/*
function drawReducedGraphWithVis(nodes, links, criticalPathSet, outlierTasksSet) {
    console.log("drawReducedGraphWithVis", "nodes: ", nodes, "links: ", links);
    console.log("drawReducedGraphWithVis", "criticalPathSet: ", criticalPathSet, "outlierTasksSet: ", outlierTasksSet);

    const container = document.getElementById('dependency_chart');
    const configContainer = document.getElementById('configuration-container');


    // Side panel for node information
    const infoPanel = document.getElementById('info-panel');

    // Pan and Centering Controls
    const controlsDiv = document.createElement('div');
    controlsDiv.style.textAlign = 'center';
    controlsDiv.style.padding = '10px';
    controlsDiv.style.backgroundColor = '#f5f5f5'; // Light gray background for better visibility

    const btnLeft = document.createElement('button');
    btnLeft.textContent = '←';
    controlsDiv.appendChild(btnLeft);

    const btnUp = document.createElement('button');
    btnUp.textContent = '↑';
    controlsDiv.appendChild(btnUp);

    const btnDown = document.createElement('button');
    btnDown.textContent = '↓';
    controlsDiv.appendChild(btnDown);

    const btnRight = document.createElement('button');
    btnRight.textContent = '→';
    controlsDiv.appendChild(btnRight);

    const btnCenter = document.createElement('button');
    btnCenter.textContent = 'Center';
    controlsDiv.appendChild(btnCenter);

    container.appendChild(controlsDiv);

    const clusterByHubSizeButton = document.createElement('button');
    clusterByHubSizeButton.textContent = 'Cluster by Hub Size';
    controlsDiv.appendChild(clusterByHubSizeButton);

    const clusterByAttributeButton = document.createElement('button');
    clusterByAttributeButton.textContent = 'Cluster by Attribute';
    controlsDiv.appendChild(clusterByAttributeButton);

    const declusterButton = document.createElement('button');
    declusterButton.textContent = 'De-cluster';
    controlsDiv.appendChild(declusterButton);

    // Search functionality
    const searchInput = document.createElement('input');
    searchInput.setAttribute('placeholder', 'Search for a node...');
    searchInput.addEventListener('input', function () {
        const query = this.value;
        const nodeToFocus = nodes.find(node => node.ID === query || node.Name.includes(query));
        if (nodeToFocus) {
            network.focus(nodeToFocus.ID, {
                scale: 1.5,
                animation: {
                    duration: 500,
                    easingFunction: "easeInOutQuad"
                }
            });
        }
    });
    container.appendChild(searchInput);

    // Modify nodes based on their type (critical path, outlier path, both, or neither)
    nodes.forEach(node => {
        if (criticalPathSet.has(node.ID) && outlierTasksSet.has(node.ID)) {
            node.color = { background: 'purple' }; // Both critical and outlier
        } else if (criticalPathSet.has(node.ID)) {
            node.color = { background: 'red' }; // Only critical
        } else if (outlierTasksSet.has(node.ID)) {
            node.color = { background: 'blue' }; // Only outlier
        } else {
            node.color = { background: 'grey' }; // Neither
        }
    });

    // Modify edges based on their length
    links.forEach(edge => {
        edge.label = `Duration: ${edge.length / 20}`;
    });

    // Prepare the data
    const data = {
        nodes: new vis.DataSet(nodes.map(node => ({
            id: node.ID,
            label: node.ID,
            title: `<strong>ID:</strong> ${node.ID}<br><strong>Name:</strong> ${node.Name}`,  // enhanced tooltip
            value: node.degree, // use degree for node size
            color: node.degree > 2 ? "#46b9fa" : "#8ce6ff",  // dynamic coloring based on degree
            font: {
                color: "#ffffff",
                size: 24
            }
        }))),
        edges: new vis.DataSet(links.map(link => ({
            from: link.source.ID,  // use the ID attribute of the source node
            to: link.target.ID,    // use the ID attribute of the target node
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 1.5
                }
            },
            color: {
                color: "#a3d1ff",
                opacity: 0.8,
                inherit: 'from'
            },
            length: link.duration * 20,
            hiddenLabel: `Duration: ${isNaN(link.duration) ? 0 : link.duration}`,
            font: { color: 'transparent' }  // hide the label initially
        })))

    };

    // Configure the options
    const options = {
        nodes: {
            shape: "circle",
            borderWidth: 3,
            borderWidthSelected: 5,
            scaling: {
                min: 20,
                max: 100
            },
            chosen: {
                node: function (values, id, selected, hovering) {
                    if (hovering) {
                        values.color = '#ffa3a3';  // Color when hovering over the node
                    } else if (selected) {
                        values.color = '#ff0000';  // Color when the node is selected
                    } else {
                        values.color = values.originalColor || "#5ac8fa";  // Default color
                    }
                }
            },
        },
        edges: {
            width: 2.5,
            smooth: {
                type: "dynamic"
            },
            font: {
                size: 12,
                align: 'middle'
            },
            chosen: {
                edge: function (values, id, selected, hovering) {
                    values.color = selected ? '#ff0000' : '#a3d1ff';
                    values.font.color = hovering ? '#000000' : 'transparent'; // Show label on hover
                }
            }
        },
        interaction: {
            hover: true,
            hoverConnectedEdges: true,
            selectConnectedEdges: true
        },
        // Physics tweaking options
        physics: {
            maxVelocity: 50,
            minVelocity: 0.1,
            solver: 'barnesHut',
            barnesHut: {
                gravitationalConstant: -3000,
                centralGravity: 0.5
            },
            stabilization: {
                iterations: 2500
            }
        },
        configure: {
            enabled: true,              // Enable or disable the panel
            filter: true,               // The filter function or boolean to determine which options are shown
            container: configContainer,       // The DOM element where the configuration UI will be created; if not provided, it will be next to the network.
            showButton: true            // Show or hide the generate options button
        }
    };


    // Initialize the network
    const network = new vis.Network(container, data, options);

    // Cluster by hub size
    clusterByHubSizeButton.addEventListener('click', function () {
        network.clusterByHubsize(undefined, {
            clusterNodeProperties: {
                shape: 'box',
                size: 30,
                color: '#FF9999',
                borderWidth: 3,
                borderWidthSelected: 5,
                label: 'Cluster'
            }
        });
    });

    // Cluster by attribute (for this example, we're clustering nodes with similar degrees)
    clusterByAttributeButton.addEventListener('click', function () {
        const clusterOptionsByData = {
            joinCondition: function (childOptions) {
                return childOptions.degree > 2;
            },
            clusterNodeProperties: {
                id: 'degreeCluster',
                borderWidth: 3,
                shape: 'star',
                size: 40,
                color: '#FFFF00',
                label: 'Nodes with high degree'
            }
        };
        network.cluster(clusterOptionsByData);
    });

    // De-cluster
    declusterButton.addEventListener('click', function () {
        network.openCluster('degreeCluster');
    });

    // Attach event listeners for the controls
    btnLeft.addEventListener('click', function () {
        const currentPosition = network.getViewPosition();
        network.moveTo({
            position: { x: currentPosition.x + 100, y: currentPosition.y },
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    // Filtering options
    const filterBtn = document.createElement('button');
    filterBtn.textContent = 'Filter Critical & Outlier Nodes';
    filterBtn.addEventListener('click', function() {
        network.setData({
            nodes: new vis.DataSet(nodes.filter(node => criticalPathSet.has(node.ID) || outlierTasksSet.has(node.ID))),
            edges: data.edges
        });
    });
    container.appendChild(filterBtn);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Filter';
    resetBtn.addEventListener('click', function() {
        network.setData(data);
    });
    container.appendChild(resetBtn);

    btnUp.addEventListener('click', function () {
        const currentPosition = network.getViewPosition();
        network.moveTo({
            position: { x: currentPosition.x, y: currentPosition.y + 100 },
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    btnRight.addEventListener('click', function () {
        const currentPosition = network.getViewPosition();
        network.moveTo({
            position: { x: currentPosition.x - 100, y: currentPosition.y },
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    btnDown.addEventListener('click', function () {
        const currentPosition = network.getViewPosition();
        network.moveTo({
            position: { x: currentPosition.x, y: currentPosition.y - 100 },
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    btnCenter.addEventListener('click', function () {
        network.fit({
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });

    // Focus on a node and its direct neighbors when the node is clicked
    network.on("click", function (properties) {
        const selectedNodeId = properties.nodes[0];
        if (selectedNodeId) {
            const selectedNode = nodes.find(node => node.ID === selectedNodeId);
            infoPanel.innerHTML = `
                                    <h3>Node Details</h3>
                                    <p><strong>ID:</strong> ${selectedNode.ID}</p>
                                    <p><strong>Name:</strong> ${selectedNode.Name}</p>
                                    <p><strong>Degree:</strong> ${selectedNode.degree}</p>
                                `;
        } else {
            infoPanel.innerHTML = '';
        }
    });
    // Node Dragging Enhancements
    network.on("dragEnd", function (params) {
        if (params.nodes.length) {
            const draggedNode = data.nodes.get(params.nodes[0]);
            draggedNode.fixed = {
                x: true,
                y: true
            };
            data.nodes.update(draggedNode);
        }
    });

    // List activities sorted by ID
    const sortedNodes = nodes.sort((a, b) => a.ID - b.ID);
    const activityList = document.createElement("ul");
    sortedNodes.forEach(node => {
        const listItem = document.createElement("li");
        listItem.textContent = node.ID + ": " + node.Name;
        activityList.appendChild(listItem);
    });

    // Append the list to the path-list container
    document.getElementById("path-list").appendChild(activityList);

    // Hover enhancements
    network.on("hoverNode", function (properties) {
        const hoveredNode = nodes.find(node => node.ID === properties.node);
        let tooltipContent = `
                            <strong>ID:</strong> ${hoveredNode.ID}<br>
                            <strong>Name:</strong> ${hoveredNode.Name}<br>
                            `;

        if (criticalPathSet.has(hoveredNode.ID) && outlierTasksSet.has(hoveredNode.ID)) {
            tooltipContent += `<strong>Type:</strong> Both Critical and Outlier`;
        } else if (criticalPathSet.has(hoveredNode.ID)) {
            tooltipContent += `<strong>Type:</strong> Critical`;
        } else if (outlierTasksSet.has(hoveredNode.ID)) {
            tooltipContent += `<strong>Type:</strong> Outlier`;
        } else {
            tooltipContent += `<strong>Type:</strong> Regular`;
        }

        // Display this content in a tooltip. (Implementation depends on your tooltip library)
    });

    // Clustering
    document.getElementById('clusterBtn').addEventListener('click', function () {
        network.clusterByHubsize();
    });

    document.getElementById('declusterBtn').addEventListener('click', function () {
        network.openCluster();
    });

    // Legend (this is a simple example, you'll want to make it more dynamic)
    const legend = document.createElement('div');
    legend.style.marginTop = "20px";
    legend.innerHTML = `
                                    <strong>Legend:</strong><br>
                                    <span style="display:inline-block; width:12px; height:12px; background-color:red;"></span> High Degree Node<br>
                                    <span style="display:inline-block; width:12px; height:12px; background-color:blue;"></span> Low Degree Node<br>
                                    <span style="display:inline-block; width:20px; height:2px; background-color:#a3d1ff;"></span> Link (Hover for duration)
                                `;
    container.appendChild(legend);
}

*/

function drawArrow(source, target, container) {
    var line = container.append("line")
        .attr("class", "hover-arrow")
        .attr("x1", source.x)
        .attr("y1", source.y)
        .attr("x2", target.x)
        .attr("y2", target.y)
        .attr("stroke", "#0f0") // Sci-fi green color
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow2)");
    return line;
}

function removeArrow(container) {
    container.selectAll(".hover-arrow").remove();
}

function correctCycle(links, cycleNode, startNode) {
    // Find the link involving the cycleNode and modify the source to the startNode (ID 0)
    let linkToModify = links.find(link => link.target === cycleNode);
    if (linkToModify) {
        linkToModify.source = startNode;
        console.log("Cycle corrected by setting the predecessor of node", cycleNode, "to the start node", startNode);
    } else {
        console.error("Could not correct the cycle for node", cycleNode);
    }
}

function displayPaths(paths, title, targetDivID) {
    // Generate the HTML content
    let htmlContent = `<h3>${title}</h3>`;
    paths.forEach((path, index) => {
        htmlContent += `<p>Path ${index + 1}:</p><ul>`;
        path.forEach(node => {
            htmlContent += `<li>Node ID: ${node.ID}, Name: ${node.Name}</li>`;
        });
        htmlContent += '</ul>';
    });

    // Set the HTML content of the <div> element
    document.getElementById(targetDivID).innerHTML = htmlContent;
}

function findCriticalPath(paths, links) {
    let criticalPath = [];
    let maxDuration = 0;

    paths.forEach(path => {
        let pathDuration = 0;

        console.log(`Evaluating path: ${path.map(node => node.ID).join(" -> ")}`); // Debugging line to display current path

        for (let i = 0; i < path.length - 1; i++) {
            let link = links.find(l => l.source === path[i] && l.target === path[i + 1]);
            if (!link) {
                console.warn(`No link found between ${path[i].ID} and ${path[i + 1].ID}`);  // Warning if link is not found
                continue;
            }

            let linkDuration = Number(link.duration);  // Ensure the duration is a number
            if (isNaN(linkDuration)) {
                console.warn(`Invalid duration for link between ${link.source.ID} and ${link.target.ID}`);
                continue;
            }

            pathDuration += linkDuration;

            console.log(`Duration of link between ${link.source.ID} and ${link.target.ID}: ${linkDuration}`);  // Debugging line
            console.log(`Cumulative path duration: ${pathDuration}`);  // Debugging line
        }

        if (pathDuration > maxDuration) {
            maxDuration = pathDuration;
            criticalPath = path;
        }
    });
    // Label nodes on the critical path
    criticalPath.forEach(node => {
        node.isOnCriticalPath = true;
    });
    console.log("Critical path:", criticalPath.map(node => node.ID).join(" -> "), "Max Duration: ", maxDuration); // Debugging line
    return { path: criticalPath, duration: maxDuration };
}

function findOutlierPaths(paths, links) {
    console.log("findOutlierPaths: Entry, Initial Paths:", paths, links);

    // Calculate the total duration for each path
    const pathDurations = paths.map(path => {
        let duration = path.reduce((total, node, index, array) => {
            if (index < array.length - 1) {
                let link = links.find(l => l.source.ID === node.ID && l.target.ID === array[index + 1].ID);
                if (!link) {
                    console.warn(`No link found between ${node.ID} and ${array[index + 1].ID}`);
                    return total;
                }

                let linkDuration = Number(link.duration);
                if (isNaN(linkDuration)) {
                    console.warn(`Invalid duration for link between ${link.source.ID} and ${link.target.ID}`);
                    return total;
                }

                return total + linkDuration;
            }
            return total;
        }, 0);
        return { path, duration };
    });

    // Remove duplicate paths
    const uniquePathDurations = [];
    pathDurations.forEach(pathDuration => {
        const pathString = JSON.stringify(pathDuration.path.map(node => node.ID));
        if (!uniquePathDurations.some(unique => JSON.stringify(unique.path.map(node => node.ID)) === pathString)) {
            uniquePathDurations.push(pathDuration);
        }
    });

    // Sort the unique pathDurations based on duration
    uniquePathDurations.sort((a, b) => a.duration - b.duration);

    // Calculate the first and third quartiles (Q1 and Q3)
    const q1 = uniquePathDurations[Math.floor(uniquePathDurations.length / 4)].duration;
    const q3 = uniquePathDurations[Math.floor(3 * uniquePathDurations.length / 4)].duration;

    // Calculate the interquartile range (IQR)
    const iqr = q3 - q1;

    // Set the lower and upper thresholds
    const lowerThreshold = q1 - 1.5 * iqr;
    const upperThreshold = q3 + 1.5 * iqr;

    // Filter the outlier paths based on the thresholds
    const outlierPathDurations = uniquePathDurations.filter(pathDuration => pathDuration.duration < lowerThreshold || pathDuration.duration > upperThreshold);

    // Log information
    outlierPathDurations.forEach(pathDuration => {
        console.log(`Outlier Path:`);
        pathDuration.path.forEach((node, nodeIndex) => {
            let linkDuration = 0;
            if (nodeIndex < pathDuration.path.length - 1) {
                let link = links.find(l => l.source === node && l.target === pathDuration.path[nodeIndex + 1]);
                linkDuration = link ? Number(link.duration) : 0;
            }
            console.log(`Node ID: ${node.ID}, Node Duration: ${node.Duration}, Link Duration to next node: ${linkDuration}`);
        });
        console.log(`Total Duration for Path:`, pathDuration.duration);
    });

    // Label nodes on the outlier paths
    outlierPathDurations.forEach(pathDuration => {
        pathDuration.path.forEach(node => {
            node.isOnOutlierPath = true;
        });
    });

    return { 
        paths: outlierPathDurations.map(pd => pd.path), 
        durations: outlierPathDurations.map(pd => pd.duration) 
    };
}



// Displaying all paths
displayPaths(paths, 'All Paths:', 'pathsDisplay');
// Displaying the longest path and outlier paths
displayPaths([longestPath], 'Longest Path:', 'longestPathDisplay');
displayPaths(outlierPaths, 'Outlier Paths:', 'outlierPathsDisplay');

document.getElementById("highlightCriticalPath").addEventListener("change", updatePathsDisplay);
document.getElementById("highlightOutliers").addEventListener("change", updatePathsDisplay);

function updatePathsDisplay() {
    // Clear previous highlights
    clearHighlights();

    // Update critical path, outlier paths, and all paths based on checkboxes
    updateCriticalPathDisplay();
    updateOutlierPathsDisplay();
    updateAllPathsDisplay();
}

var acc = document.getElementsByClassName("accordion-button");
var i;

for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
        }
    });
}

function highlightPath(path, color, link, node, duration) {
    link.style("stroke", function (l) {
        if (path.includes(l.source) && path.includes(l.target)) {
            return color;
        }
        // Keep the existing color if not in the path
        return d3.select(this).style("stroke");
    }).attr("stroke-width", function (l) {
        if (path.includes(l.source) && path.includes(l.target)) {
            return 4;
        }
        // Keep the existing stroke-width if not in the path
        return d3.select(this).attr("stroke-width");
    });

    node.select("circle").style("fill", function (n) {
        if (path.includes(n)) {
            return color;
        }
        // Keep the existing fill color if not in the path
        return d3.select(this).style("fill");
    }).attr("r", function (n) {
        if (path.includes(n)) {
            return 30;
        }
        // Keep the existing radius if not in the path
        return d3.select(this).attr("r");
    });

    var tooltip = d3.select(".tooltip");
    tooltip.html(`Path Duration: ${duration} units`).style("background-color", 'color');
}


function clearHighlights() {
    link.style("stroke", null)
        .attr("stroke-width", 2);

    node.select("circle").style("fill", function (n) {
        var selectedMetric = document.querySelector('input[name="colorMetric"]:checked').value;
        var metricValue;

        switch (selectedMetric) {
            case "inDegree":
                metricValue = n.inDegree;
                break;
            case "outDegree":
                metricValue = n.outDegree;
                break;
            case "degree":
                metricValue = n.degree;
                break;
            default:
                metricValue = n.inDegree; // default to in-degree if something goes wrong
        }

        switch (true) {
            case metricValue > 4: return "#41afeb";
            case metricValue > 3: return "#46b9fa";
            case metricValue > 2: return "#5ac8fa";
            case metricValue > 1: return "#8ce6ff";
            default: return "#b4f5ff";
        }
    });
}

function updateCriticalPathDisplay() {
    if (document.getElementById("highlightCriticalPath").checked) {
        const criticalPath = findCriticalPath(paths, links);
        highlightPath(criticalPath.path, 'red'); // Highlight the critical path in red
    }
}

function updateOutlierPathsDisplay() {
    if (document.getElementById("highlightOutliers").checked) {
        const outlierPaths = findOutlierPaths(paths, links);
        outlierPaths.paths.forEach(outlierPath => {
            highlightPath(outlierPath, 'orange'); // Highlight outlier paths in orange
        });
        const criticalPath = findCriticalPath(paths, links);
        highlightPath(criticalPath.path, 'red'); // Highlight the critical path in red
    }
}

function updateAllPathsDisplay() {
    // If you want to highlight all paths in a specific color, you can do so here
    paths.forEach(path => {
        highlightPath(path, 'blue'); // Highlight all paths in blue
    });
}

function updateLegend() {
    var selectedMetric = document.querySelector('input[name="colorMetric"]:checked').value;
    var metricText;

    switch (selectedMetric) {
        case "inDegree":
            metricText = "In-degree";
            break;
        case "outDegree":
            metricText = "Out-degree";
            break;
        case "degree":
            metricText = "Degree";
            break;
        default:
            metricText = "In-degree"; // default to in-degree if something goes wrong
    }

    document.getElementById("legendMetric").textContent = metricText;
}
function showTooltip(content, color) {
    const tooltip = d3.select("#tooltip");
    tooltip.transition()
        .duration(200)
        .style("visibility", "visible");
    tooltip.html(content)
        .style("top", "10px")
        .style("right", "10px")
        .style("color", color);
}

// Add event listener to the radio buttons to update the legend when the metric changes
var radios = document.querySelectorAll('input[name="colorMetric"]');
radios.forEach(radio => {
    radio.addEventListener("change", updateLegend);
});

// Call this once at the start to set the initial state of the legend:
updateLegend();

function drawCharts(nodes, links) {
    let dampingFactor = 0.85;  // Example damping factor for PageRank, adjust as needed
    let maxIterations = 100;   // Example max iterations for both PageRank and Eigenvector centrality

    computeNetworkMetrics(nodes, links, dampingFactor, maxIterations).then(result => {
        console.log("Updated Nodes with Metrics:", result.updatedNodes);
        console.log("Network Density:", result.networkDensity);

        // Move all your drawing functions inside this .then() block
        drawScatterPlotWithD3(result.updatedNodes, links);  // Use the updated nodes
        console.log("Drawing S-Curve...");
        drawSCurve(result.updatedNodes, links);  // Use the updated nodes
        console.log("Drawing Histogram...");
        drawHistogramChartJS(result.updatedNodes, links);  // Use the updated nodes
        console.log("Drawing Pie Chart...");
        drawPieChart(result.updatedNodes, links);  // Use the updated nodes
        drawPathsDistributionCurve(result.updatedNodes, links);  // Use the updated nodes
        drawRadialChart(result.updatedNodes, links);  // Use the updated nodes
        drawPathDistributionStackedBarChart(nodes, links)
        drawReferenceTable(nodes);
        // Assuming you have paths and links available
        //const criticalPathData = findCriticalPath(paths, links);
        //const outlierPathsData = findOutlierPaths(paths, links);
        //populatePathsTable(criticalPathData, outlierPathsData);
        // Call the function to render the Risk Matrix chart
        drawRiskMatrix(result.updatedNodes, links);  // Use the updated nodes
        // Generate the paths table
        generatePathsTable(result.updatedNodes, links);

        // Generate reduced graph using PageRank with durations, critical path, and outliers
        console.log("About to Enter drawReducedGraphWithVis");
        const result1 = constructNetworkUsingPageRankWithDurationsCriticalPathAndOutliers(result.updatedNodes, links);
        const resultReduced = constructNetworkUsingPageRankWithDurationsCriticalPathAndOutliers(result1.nodes, result1.links);
        //console.log("About to Enter drawReducedGraphWithVis2", resultReduced.nodes, resultReduced.links, resultReduced.criticalPathSet, resultReduced.outlierTasksSet);
        //drawReducedGraphWithVis(resultReduced.nodes, resultReduced.links, resultReduced.criticalPathSet, resultReduced.outlierTasksSet);
        drawReducedGraphWithVis(resultReduced.nodes, resultReduced.links);

    });
}

google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(initializeDataAndDrawCharts);

function drawSCurve(nodes, links) {
    links.forEach(link => {
        link.duration = +link.duration;
    });
    console.log("Drawing S-Curve with nodes data:", nodes);
    console.log("Drawing S-Curve with links data:", links);
    // Convert all durations to numbers

    //let tasksSortedByDuration = links.slice().sort((a, b) => a.duration - b.duration);
    let nonZeroDurationTasks = links.filter(link => link.duration > 0); // filtering out tasks with a duration of 0
    let tasksSortedByDuration = nonZeroDurationTasks.slice().sort((a, b) => a.duration - b.duration);

    let cumulativeData = [["Duration", "Cumulative Count"]];
    let cumulativeCount = 0;

    for (let link of tasksSortedByDuration) {
        cumulativeCount++;
        cumulativeData.push([link.duration, cumulativeCount]);
    }

    var maxDuration = Math.max(...cumulativeData.map(d => d[0]));
    var data = google.visualization.arrayToDataTable(cumulativeData);
    var options = {
        title: 'S-Curve of Task Completion',
        titleTextStyle: { color: '#ffffff' },  // Setting the title text color to white
        hAxis: { title: 'Duration', textStyle: { color: '#b4f5ff' }, gridlines: { color: '#195a8c' }, baselineColor: '#3292cd' },
        vAxis: { title: 'Cumulative Count', textStyle: { color: '#b4f5ff' }, gridlines: { color: '#195a8c' }, baselineColor: '#3292cd' },
        legend: {
            position: 'bottom',
            textStyle: { color: '#ffffff' } // Setting the legend text color to white
        },
        backgroundColor: '#113464',
        colors: ['#46b9fa'] // Color for the line
    };
    options.hAxis.viewWindow = { min: 0, max: maxDuration };
    var chart = new google.visualization.LineChart(document.getElementById('scurve_chart'));
    chart.draw(data, options);
}

function drawHistogramChartJS(nodes, links) {
    console.log("Drawing Histogram with links data:", links);

    let durations = links.map(link => link.duration);
    let histogramData = {};
    let taskNamesForDuration = {}; // Store task names for each duration

    durations.forEach((duration, index) => {
        if (histogramData[duration]) {
            histogramData[duration]++;
            taskNamesForDuration[duration].push(links[index].source.Name + " to " + links[index].target.Name); // Assuming source and target have a 'Name' property
        } else {
            histogramData[duration] = 1;
            taskNamesForDuration[duration] = [links[index].source.Name + " to " + links[index].target.Name];
        }
    });

    let maxDuration = Math.max(...durations);

    var xTicks = [];
    for (let i = 0; i <= maxDuration; i++) {
        xTicks.push(i);
    }

    new Chart(document.getElementById('histogramChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(histogramData),
            datasets: [{
                label: 'Task Durations',
                data: Object.values(histogramData),
                backgroundColor: 'rgba(70, 185, 250, 0.5)',
                borderColor: 'rgba(70, 185, 250, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Tasks',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#b4f5ff'
                    },
                    grid: {
                        color: '#195a8c'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Task Duration',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#b4f5ff',
                        autoSkip: false,
                        maxRotation: 90,
                        minRotation: 90
                    },
                    grid: {
                        color: '#195a8c'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let duration = context.label;
                            let taskNames = taskNamesForDuration[duration];
                            return [
                                'Duration: ' + duration,
                                'Number of Tasks: ' + histogramData[duration],
                                'Tasks: ' + taskNames.join(', ')
                            ];
                        }
                    }
                }
            }
        }
    });
}


function drawPieChart(nodes, links) {
    console.log("Drawing Pie Chart with links data:", links);

    const sliceCount = 5; // Number of slices we want on our pie chart
    let durations = links.map(link => link.duration).sort((a, b) => a - b);
    let maxDuration = durations[durations.length - 1];
    let minDuration = durations[0];
    let rangeSize = Math.ceil((maxDuration - minDuration + 1) / sliceCount);
    let durationRanges = {};

    // Initialize the ranges
    for (let i = 0; i < sliceCount; i++) {
        let start = minDuration + i * rangeSize;
        let end = start + rangeSize - 1;
        if (i === sliceCount - 1) {
            end = maxDuration; // For the last slice, ensure the end is the actual max duration
        }
        let key = start === end ? `${start}` : `${start}-${end}`;
        durationRanges[key] = 0;
    }

    // Categorize durations
    for (let link of links) {
        let category = Object.keys(durationRanges).find(range => {
            let [start, end] = range.split('-').map(Number);
            if (!end) end = start; // For ranges representing a single value
            return link.duration >= start && link.duration <= end;
        });
        durationRanges[category]++;
    }

    // Generate the pie data with counts appended to the labels
    let pieData = [["Duration Range", "Count"]];
    for (let range in durationRanges) {
        pieData.push([`${range} days (${durationRanges[range]} tasks)`, durationRanges[range]]);
    }

    var data = google.visualization.arrayToDataTable(pieData);
    var options = {
        title: 'Distribution of Task Durations with Task Counts',
        titleTextStyle: { color: '#ffffff' },
        backgroundColor: '#113464',
        legend: {
            position: 'bottom',
            textStyle: { color: '#ffffff' }
        },
        tooltip: {
            text: 'percentage',  // Display percentage in the tooltip
            textStyle: { color: '#000000' }  // Set tooltip text color to black
        }
    };

    var chart = new google.visualization.PieChart(document.getElementById('pie_chart'));
    chart.draw(data, options);
}


function drawPathsDistributionCurve(nodes, links) {
    // Find start and end nodes
    var startNode = nodes.find(node => node.ID === "0"); // Assuming ID is a string
    var endNode = nodes.reduce((a, b) => (a.ID > b.ID) ? a : b);

    // Find all paths from startNode to endNode
    var paths = findAllPaths(startNode, endNode, links, nodes);

    // Calculate the total duration for each path
    const pathDurations = paths.map(path => {
        return path.reduce((total, node, index, array) => {
            if (index < array.length - 1) {
                let link = links.find(l => l.source === node && l.target === array[index + 1]);
                if (!link) {
                    return total;
                }
                return total + link.duration;
            }
            return total;
        }, 0);
    });

    // Group paths by their duration to get counts
    const durationCounts = {};
    pathDurations.forEach(duration => {
        durationCounts[duration] = (durationCounts[duration] || 0) + 1;
    });

    // Convert the durationCounts object to an array suitable for Google Charts
    const dataForChart = [["Path Length", "Number of Paths"]];
    for (let duration in durationCounts) {
        dataForChart.push([+duration, durationCounts[duration]]);
    }

    var data = google.visualization.arrayToDataTable(dataForChart);
    var options = {
        title: 'Distribution of Path Lengths',
        titleTextStyle: { color: '#ffffff' },
        hAxis: {
            title: 'Path Length',
            titleTextStyle: { color: '#ffffff' }, // Set title text color to white
            textStyle: { color: '#b4f5ff' },
            gridlines: { color: '#195a8c' },
            baselineColor: '#3292cd'
        },
        vAxis: {
            title: 'Number of Paths',
            titleTextStyle: { color: '#ffffff' }, // Set title text color to white
            textStyle: { color: '#b4f5ff' },
            gridlines: { color: '#195a8c' },
            baselineColor: '#3292cd'
        },
        legend: {
            position: 'bottom',
            textStyle: { color: '#ffffff' }
        },
        backgroundColor: '#113464',
        colors: ['#46b9fa']
    };

    var chart = new google.visualization.LineChart(document.getElementById('path_distribution_chart'));
    chart.draw(data, options);
}

function formatDate(dateString) {
    let date = new Date(dateString);
    let day = String(date.getUTCDate()).padStart(2, '0');
    let month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed in JS
    let year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
}


function drawRiskMatrix(nodes, links) {
    console.log("Entered drawRiskMatrix");

    var scores = nodes.map(node => ({
        id: node.ID,
        riskScore: node.riskScore,
        importanceScore: node.importanceScore,
        combinedScore: (node.riskScore + node.importanceScore) / 2,
        name: node.Name,
        start: node.Start,
        finish: node.Finish,
        pageRank: node.pageRank,
        slack: node.slack,
        path: node.isOnCriticalPath ? 'Critical Path' :
            node.isOnOutlierPath ? 'Outlier Path' : 'Regular Path',
        overrunProbability: node.overrun_probability || 0  // Added this line
    }));

    // First, find the min and max combined scores
    // Log the combined scores for validation
    console.log("Combined scores:", scores.map(s => s.combinedScore));

    const minCombinedScore = Math.min(...scores.map(s => s.combinedScore));
    const maxCombinedScore = Math.max(...scores.map(s => s.combinedScore));

    // Define the getColorForCombinedScore function within the drawRiskMatrix function
    function getColorForCombinedScore(combinedScore) {
        // If the combinedScore is NaN, return a distinct color
        if (isNaN(combinedScore)) {
            return `rgb(128, 128, 128)`;  // Return a neutral gray color
        }

        // If max and min combined scores are essentially the same, normalize to 0.5 (middle value)
        if (maxCombinedScore - minCombinedScore < 0.0001) {
            combinedScore = (maxCombinedScore + minCombinedScore) / 2;
        }

        const normalizedScore = (combinedScore - minCombinedScore) / (maxCombinedScore - minCombinedScore);

        const red = Math.floor(255 * normalizedScore);
        const green = Math.floor(255 * (1 - normalizedScore));

        const color = `rgb(${red}, ${green}, 0)`;
        console.log("Returning color:", color);  // Debug log
        return color;
    }

    // Function to calculate IQR and identify outliers
    function identifyOutliers(data) {
        const values = data.slice().sort((a, b) => a - b);
        const q1 = values[Math.floor((values.length / 4))];
        const q3 = values[Math.floor((values.length * 3) / 4)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 5 * iqr;
        const upperBound = q3 + 5 * iqr;
        return data.map(score => score < lowerBound || score > upperBound);
    }

    const riskOutliers = identifyOutliers(scores.map(s => s.riskScore));
    const importanceOutliers = identifyOutliers(scores.map(s => s.importanceScore));

    // Filter nodes to only include outliers based on risk or importance
    const outlierScores = scores.filter((_, idx) => riskOutliers[idx] || importanceOutliers[idx]);

    const scatterData = outlierScores.map(score => ({
        x: score.riskScore,
        y: score.importanceScore,
        combinedScore: score.combinedScore,
        name: score.name,
        path: score.path
    }));

    const maxRisk = Math.max(...scores.map(s => s.riskScore));
    const minRisk = Math.min(...scores.map(s => s.riskScore));

    const maxImportance = Math.max(...scores.map(s => s.importanceScore));
    const minImportance = Math.min(...scores.map(s => s.importanceScore));

    const riskRange = maxRisk - minRisk;
    const importanceRange = maxImportance - minImportance;

    const adjustedMinRisk = minRisk - 0.05 * riskRange;
    const adjustedMaxRisk = maxRisk + 0.05 * riskRange;

    const adjustedMinImportance = minImportance - 0.05 * importanceRange;
    const adjustedMaxImportance = maxImportance + 0.05 * importanceRange;

    var ctx = document.getElementById('riskMatrix').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Risks',
                data: scatterData,
                backgroundColor: context => getColorForCombinedScore(context.dataset.data[context.dataIndex].combinedScore),
                borderColor: 'white',
                borderWidth: 1,
                pointStyle: 'circle',
                pointRadius: 8,
                hoverRadius: 12
            }]
        },
        options: {
            scales: {
                y: {
                    min: adjustedMinImportance,
                    max: adjustedMaxImportance,
                    title: {
                        display: true,
                        text: 'Importance',
                        color: 'white',
                        font: {
                            size: 16
                        }
                    },
                    ticks: {
                        color: 'white',
                        beginAtZero: true,
                        fontSize: 14
                    },
                    grid: {
                        color: '#b4f5ff',
                        lineWidth: 0.5
                    }
                },
                x: {
                    min: adjustedMinRisk,
                    max: adjustedMaxRisk,
                    title: {
                        display: true,
                        text: 'Risk',
                        color: 'white',
                        font: {
                            size: 16
                        }
                    },
                    ticks: {
                        color: 'white',
                        beginAtZero: true,
                        fontSize: 14
                    },
                    grid: {
                        color: '#b4f5ff',
                        lineWidth: 0.5
                    }
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'point', // Ensure tooltips show for each individual data point
                    callbacks: {
                        label: context => {
                            var score = context.dataset.data[context.dataIndex];
                            return score.name + ' (Risk: ' + score.x.toFixed(2) + ', Importance: ' + score.y.toFixed(2) + ', Path: ' + score.path + ')';
                        }
                    }
                }
            }
        }
    });

    // Populate the risk table with only outlier nodes
    var riskTableBody = document.getElementById('riskTableBody');
    riskTableBody.innerHTML = '';
    outlierScores.forEach(function (score, index) {
        if (!score) {
            console.error("Undefined score at index:", index);
            return; // Skip this iteration
        }
        var row = document.createElement('tr');
        var idCell = document.createElement('td');
        var nameCell = document.createElement('td');
        var riskCell = document.createElement('td');
        var importanceCell = document.createElement('td');
        var pathCell = document.createElement('td');
        var startCell = document.createElement('td');
        var finishCell = document.createElement('td');
        var pageRankCell = document.createElement('td');
        //pageRankCell.textContent = score.pageRank.toFixed(5);
        pageRankCell.textContent = (score.pageRank || 0).toFixed(5);
        var slackCell = document.createElement('td');
        slackCell.textContent = score.slack.toFixed(2); // Assuming slack is a number
        var overrunProbabilityCell = document.createElement('td');  // Added this block
        overrunProbabilityCell.textContent = score.overrunProbability.toFixed(2);

        idCell.textContent = score.id;
        nameCell.textContent = score.name;
        riskCell.textContent = score.riskScore.toFixed(2);
        importanceCell.textContent = score.importanceScore.toFixed(2);
        pathCell.textContent = score.path;
        startCell.textContent = score.start;
        finishCell.textContent = score.finish;

        startCell.textContent = formatDate(score.start);
        finishCell.textContent = formatDate(score.finish);

        // Adjust text color based on path type
        if (score.path === 'Critical Path') {
            pathCell.style.color = 'red';
        } else if (score.path === 'Outlier Path') {
            pathCell.style.color = 'orange';
        }

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(riskCell);
        row.appendChild(importanceCell);
        row.appendChild(pathCell);
        row.appendChild(pageRankCell);
        row.appendChild(startCell);
        row.appendChild(finishCell);
        row.appendChild(slackCell);
        row.appendChild(overrunProbabilityCell);

        riskTableBody.appendChild(row);
    });
}

function populatePathsTable(criticalPathData, outlierPathsData) {
    const tableBody = document.getElementById('pathTableBody');

    // Add critical path
    const criticalRow = document.createElement('tr');
    criticalRow.innerHTML = `
                                    <td class="critical">Critical Path</td>
                                    <td class="critical">${criticalPathData.duration}</td>
                                    ${criticalPathData.path.map(node => `<td class="critical">${node.ID}</td>`).join('')}
                                `;
    tableBody.appendChild(criticalRow);

    // Add outlier paths
    outlierPathsData.paths.forEach((path, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
                                        <td class="outlier">Outlier Path</td>
                                        <td class="outlier">${outlierPathsData.durations[index]}</td>
                                        ${path.map(node => `<td class="outlier">${node.ID}</td>`).join('')}
                                    `;
        tableBody.appendChild(row);
    });
}

function drawReferenceTable(nodes) {
    var referenceTableBody = document.getElementById('referenceTableBody');
    referenceTableBody.innerHTML = '';
    nodes.forEach(function (node) {
        if (node.isOnCriticalPath || node.isOnOutlierPath) {
            var row = document.createElement('tr');
            var idCell = document.createElement('td');
            var nameCell = document.createElement('td');
            var pathCell = document.createElement('td');

            idCell.textContent = node.ID;
            nameCell.textContent = node.Name;

            if (node.isOnCriticalPath) {
                pathCell.textContent = 'Critical Path';
                pathCell.style.color = 'red';
            } else if (node.isOnOutlierPath) {
                pathCell.textContent = 'Outlier Path';
                pathCell.style.color = 'orange';
            } else {
                pathCell.textContent = 'Regular Path';
            }

            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(pathCell);

            referenceTableBody.appendChild(row);
        }
    });
}

function drawRadialChart(nodes) {
    var ctx = document.getElementById('radialChart').getContext('2d');

    const themeColors = [
        "#cdfaff", "#b4f5ff", "#8ce6ff", "#5ac8fa", 
        "#46b9fa", "#41afeb", "#3292cd", "#287dc8", 
        "#1e69aa", "#195a8c"
    ];

    const supplementaryColors = [
        "#FFA500", // Orange (Used sparingly for differentiation)
        "#9400D3"  // Violet (Used sparingly for differentiation)
    ];

    function generateColor(index) {
        if (index < themeColors.length) {
            return themeColors[index];
        } else {
            return supplementaryColors[index - themeColors.length];
        }
    }

    nodes.sort((a, b) => b.Duration - a.Duration);
    const N = 8;
    nodes = nodes.slice(0, N);

    var myChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: nodes.map(node => node.Name),
            datasets: [{
                data: nodes.map(node => node.Duration),
                backgroundColor: nodes.map((_, index) => generateColor(index)),
                borderWidth: 1,
                borderColor: ['#ffffff']
            }]
        },
        options: {
            responsive: true,
            legend: {
                position: 'top',
                labels: {
                    fontColor: themeColors[5]
                }
            },
            title: {
                display: true,
                text: 'Activity Duration Radial Chart',
                fontColor: themeColors[6]
            },
            scale: {
                ticks: {
                    beginAtZero: true,
                    fontColor: themeColors[7],
                    stepSize: Math.max(...nodes.map(node => node.Duration)) / 10
                },
                gridLines: {
                    color: themeColors[8]
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(17, 52, 100, 0.8)', // 80% transparency
                    titleFont: {
                        size: 14,  // Reduced font size for the title
                        weight: 'bold',
                        family: "'Orbitron', sans-serif"
                    },
                    bodyFont: {
                        size: 12,  // Reduced font size for the body
                        family: "'Orbitron', sans-serif"
                    },
                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            const node = nodes[context.dataIndex];
                            return [
                                `Duration: ${node.Duration} days`,
                                `Risk: ${node.riskScore}`,
                                `Importance: ${node.importanceScore}`
                            ];
                        }
                    }
                }
            },
            onHover: (event, chartElement) => {
                if (event && event.target) {
                    event.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                }
            }
        }
    });

    ctx.canvas.onclick = function (event) {
        var activePoints = myChart.getElementsAtEventForMode(event, 'point', myChart.options);
        var firstPoint = activePoints[0];
        if (firstPoint) {
            var node = nodes[firstPoint.index];
            alert(`Clicked on: ${node.Name}`);
        }
    };
}
// Use the function as:
// drawRadialChart(nodes);

// Sample data
var chartData = [
    { label: 'Supply Chain Disruption', value: 80 },
    { label: 'Budget Overrun', value: 90 },
    { label: 'Scope Creep', value: 70 },
    { label: 'Technical Failure', value: 50 },
    { label: 'Regulatory Changes', value: 30 },
    { label: 'Safety Incident', value: 20 },
    { label: 'Resource Shortage', value: 60 },
    { label: 'Schedule Delay', value: 40 }
];

//redundannt function
function drawScatterPlotWithD3(nodes, links) {
    let nonZeroDurationTasks = links.filter(link => link.duration > 0);
    let tasksSortedByDuration = nonZeroDurationTasks.slice().sort((a, b) => a.duration - b.duration);

    let cumulativeData = [];
    let cumulativeCount = 0;
    for (let link of tasksSortedByDuration) {
        cumulativeCount++;
        cumulativeData.push({ x: link.duration, y: cumulativeCount });
    }

    let svgWidth = 400, svgHeight = 300;
    let margin = { top: 20, right: 20, bottom: 30, left: 50 };
    let width = svgWidth - margin.left - margin.right;
    let height = svgHeight - margin.top - margin.bottom;

    let x = d3.scaleLinear().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);

    let svg = d3.select("#scurve_chart2").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent(cumulativeData, d => d.x));
    y.domain([0, d3.max(cumulativeData, d => d.y)]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".dot")
        .data(cumulativeData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .style("fill", "#0077b6");
}

function drawPathDistributionStackedBarChart(nodes, links) {
    // Compute paths and their durations as before
    var startNode = nodes.find(node => node.ID === "0");
    var endNode = nodes.reduce((a, b) => (a.ID > b.ID) ? a : b);
    var paths = findAllPaths(startNode, endNode, links, nodes);
    const pathDurations = paths.map(path => {
        return path.reduce((total, node, index, array) => {
            if (index < array.length - 1) {
                let link = links.find(l => l.source === node && l.target === array[index + 1]);
                if (!link) {
                    return total;
                }
                return total + link.duration;
            }
            return total;
        }, 0);
    });

    // Group paths by their duration to get counts
    const durationCounts = {};
    pathDurations.forEach(duration => {
        durationCounts[duration] = (durationCounts[duration] || 0) + 1;
    });

    // Prepare data for chart
    const dataForChart = {
        labels: Object.keys(durationCounts),
        datasets: [{
            label: 'Number of Paths',
            data: Object.values(durationCounts),
            backgroundColor: 'rgba(70, 185, 250, 0.5)',
            borderColor: 'rgba(70, 185, 250, 1)',
            borderWidth: 1
        }]
    };

        // Calculate cumulative counts for overlay line graph
    let cumulativeCounts = [];
    let cumulativeCount = 0;
    Object.values(durationCounts).forEach(count => {
        cumulativeCount += count;
        cumulativeCounts.push(cumulativeCount);
    });

    // Update dataForChart to include cumulative count dataset
    dataForChart.datasets.push({
        label: 'Cumulative Count',
        data: cumulativeCounts,
        type: 'line',  // this will ensure dataset is drawn as a line
        borderColor: 'rgba(200, 50, 50, 0.8)',
        fill: false,
        pointBackgroundColor: 'rgba(200, 50, 50, 0.8)',
        pointBorderColor: 'rgba(200, 50, 50, 0.8)'
    });

    var ctx = document.getElementById('pathDistributionStackedBarChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',  // main type remains bar
        data: dataForChart,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Paths',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#b4f5ff'
                    },
                    grid: {
                        color: '#195a8c'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Path Duration',
                        color: '#ffffff'
                    },
                    ticks: {
                        autoSkip: true,  // auto-skip overlapping labels
                        maxTicksLimit: 10,  // maximum 10 ticks on x-axis
                        color: '#b4f5ff',
                        maxRotation: 90,
                        minRotation: 90
                    },
                    grid: {
                        color: '#195a8c'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Duration: ${context.label}, Number of Paths: ${context.dataset.data[context.dataIndex]}`;
                        }
                    }
                }
            }
        }
    });
}
