google.charts.load('current', { 'packages': ['gantt'] });
google.charts.setOnLoadCallback(initFileInput);

function initFileInput() {
    var fileInput = document.getElementById('xmlFileInput');
    fileInput.addEventListener('change', handleFileSelect, false);
}

function clearPreviousData() {
    // Clear the data table
    document.getElementById('data_div').innerHTML = '';

    // Clear Graphs and Charts
    document.getElementById('graph-container').innerHTML = '<div id="tooltip" style="position: absolute; visibility: hidden; background: #8ce6ff; padding: 8px; border: 2px solid #3292cd; border-radius: 3px; "></div><svg><defs><marker id="arrow" viewBox="0 -6 10 12" refX="9" refY="0" markerWidth="6" markerHeight="10" orient="auto"><path d="M0,-5 L10,0 L0,5" fill="#cdfaff" /></marker><marker id="arrow2" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#0f0" /></marker></defs><g class="container"></g></svg>';
    document.getElementById('chart_div').innerHTML = '';
    document.getElementById('scurve_chart').innerHTML = '';
    document.getElementById('histogramChart').getContext('2d').clearRect(0, 0, 300, 280);  // Clearing canvas for histogram
    document.getElementById('pie_chart').innerHTML = '';
    document.getElementById('path_distribution_chart').innerHTML = '';
    document.getElementById('dependency_chart').innerHTML = '';

    // Clear Error Messages
    document.getElementById('error_div').innerText = '';

    // Clearing Control Values
    document.getElementById('searchInput').value = '';
    document.getElementById('highlightAllConnected').checked = false;
    document.getElementById('highlightCriticalPath').checked = false;
    document.getElementById('highlightOutliers').checked = false;

    // Reset sliders
    document.getElementById('zoomSlider').value = 50;
    document.getElementById('filterSlider').value = 0;
    document.getElementById('outDegreeFilterSlider').value = 0;
    document.getElementById('degreeFilterSlider').value = 0;

    // Clear Path Details
    document.getElementById('criticalPathDetails').innerText = 'Critical path details go here...';
    document.getElementById('outlierPathsDetails').innerText = 'Outlier paths details go here...';
    document.getElementById('allPathsDetails').innerText = 'All paths details go here...';
}

var nodes = [];
var links = [];
function clearGraphData() {
    nodes.length = 0;  // Clear the array without losing reference
    links.length = 0;
}

function handleFileSelect(event) {
    clearPreviousData();  // Clearing the DOM
    clearGraphData();     // Clearing the data structures
    var file = event.target.files[0];
    console.log("Selected file: ", file);
    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var contents = e.target.result;
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(contents, "text/xml");
            console.log("Parsed XML: ", xmlDoc);
            drawChart(xmlDoc);
        };
        reader.readAsText(file);
    } else {
        console.error("Failed to load file");
    }
}
/**
 * Draws the data table.
 * @param {Object} data - The Google visualization DataTable.
 */
function drawDataTable(data) {
    // Create the table and set its class.
    var table = document.createElement('table');
    table.className = 'dashboard-table';

    // Create the table header and body elements.
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');

    // Add column names to the table header.
    var headerRow = document.createElement('tr');
    for (var i = 0; i < data.getNumberOfColumns(); i++) {
        var th = document.createElement('th');
        th.innerText = data.getColumnLabel(i);
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
    table.appendChild(tbody);

    // Clear previous contents of the data_div and append the new table.
    var dataDiv = document.getElementById('data_div');
    dataDiv.innerHTML = '';
    dataDiv.appendChild(table);

    // Use event delegation to handle cell editing.
    table.addEventListener('input', function (e) {
        if (e.target.tagName.toLowerCase() === 'td') {
            var cell = e.target;
            var newValue = cell.innerText;
            var row = cell.parentNode.rowIndex - 1;
            var col = cell.cellIndex;

            // Validate the newValue based on its column
            if (!validateCellValue(col, newValue)) {
                // If invalid, revert the cell's value and show an error
                cell.innerText = data.getFormattedValue(row, col);
                displayError("Invalid input. Please try again.");
                return;
            }

            // If valid, update the data model and redraw the charts
            data.setCell(row, col, newValue);
            var graphData = parseXML(xmlDocGlobal, data);
            drawGanttChart(data);
            drawGraph(graphData.nodes, graphData.links);
        }
    });

    function validateCellValue(col, value) {
        switch (col) {
            case 0: // Task ID
                return /^\d+$/.test(value);
            case 3: // Start Date
            case 4: // End Date
                return !isNaN(new Date(value).getTime());
            case 5: // Duration
                return !isNaN(value) && parseFloat(value) >= 0;
            case 6: // Percent Complete
                var percent = parseFloat(value);
                return !isNaN(percent) && percent >= 0 && percent <= 100;
            case 7: // Dependencies
                // Check if all dependencies are positive integers
                return value.split(',').every(dep => /^\d+$/.test(dep.trim()));
            default:
                return true;
        }
    }

    function displayError(message) {
        // Assuming there's a <div> with id 'error-message' to display errors
        var errorDiv = document.getElementById('error_div');
        errorDiv.innerText = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000); // Hide the error message after 5 seconds
    }

    var maxTaskDuration = 0;
    for (var i = 0; i < data.getNumberOfRows(); i++) {
        var taskDuration = data.getValue(i, data.getColumnIndex('Duration'));
        maxTaskDuration = Math.max(maxTaskDuration, taskDuration);
    }

    // Populate the table body with data from the Google DataTable.
    for (var i = 0; i < data.getNumberOfRows(); i++) {
        var dataRow = document.createElement('tr');
        for (var j = 0; j < data.getNumberOfColumns(); j++) {
            var td = document.createElement('td');
            if (j === data.getColumnIndex('Progress Bar')) {
                var taskDuration = data.getValue(i, data.getColumnIndex('Duration'));
                var barLengthPercentage = (taskDuration / maxTaskDuration) * 100;
                td.innerHTML = `
                                                <div class="progress-bar-container" style="width: 100%;">
                                                    <div class="progress-bar" style="width: ${barLengthPercentage}%;">
                                                        <div class="progress-bar-fill" style="width: 0%;"></div>
                                                    </div>
                                                </div>`;
            } else {
                td.innerText = data.getFormattedValue(i, j);
                td.contentEditable = 'true';
            }
            dataRow.appendChild(td);
        }
        tbody.appendChild(dataRow);
    }

    // Make the table sortable.
    sorttable.makeSortable(table);
}

function drawChart(xmlDoc) {
    console.log("Drawing chart with data: ", xmlDoc);
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Task ID');
    data.addColumn('string', 'Task Name');
    data.addColumn('string', 'Resource');
    data.addColumn('date', 'Start Date');
    data.addColumn('date', 'End Date');
    data.addColumn('number', 'Duration');
    data.addColumn('number', 'Percent Complete');
    data.addColumn('string', 'Dependencies');
    data.addColumn('number', 'Progress Bar');

    try {
        parseXML(xmlDoc, data);
        var dataJSON = data.toJSON();
        //document.getElementById('data_div').innerText = "DataTable in JSON format: \n" + dataJSON;
        drawDataTable(data);
        drawGanttChart(data);
        console.log('Nodes2')
        console.log("About to call drawGraph")

        var graphData = parseXML(xmlDoc, data);

        console.log('Nodes to the Charts', graphData.nodes)
        console.log('Links to the Charts', graphData.links)
        //drawCharts(graphData.nodes, graphData.links);
        console.log('Links to the Graph', graphData.links)
        drawGraph(graphData.nodes, graphData.links);
        // Now, call the chart functions with the parsed nodes and links

    } catch (err) {
        console.error("Error while parsing the XML data: ", err);
        document.getElementById('error_div').innerText = "Error: " + err.message;
    }
}

function insertStartMilestone(data, nodes, taskIDs, date) {
    if (!taskIDs['0']) {
        date.setHours(0, 0, 0, 0);
        data.addRow(['0', 'Start Milestone', '', date, date, 0, 100, null, null]);
        taskIDs['0'] = true;
        nodes.push({ ID: '0', Name: 'Start Milestone', Duration: '0', Start: date.toISOString(), Finish: date.toISOString() }); // Add the Start Node to the nodes array
    }
}

function insertEndMilestone(endMilestoneID, data, nodes, taskIDs, date, tasksWithoutSuccessors) {
    var milestoneID = endMilestoneID.toString();
    console.log('endMilestoneID: ', endMilestoneID)
    if (!taskIDs[milestoneID]) {
        date.setHours(23, 59, 59, 999);  // Set the time to the end of the day
        // Convert tasksWithoutSuccessors array to a comma-separated string to use as dependencies
        var dependencies = tasksWithoutSuccessors.join(", ");
        //data.addRow([milestoneID, 'End Milestone', '', date, date, 0, 0, null]);
        data.addRow([milestoneID, 'End Milestone', '', date, date, 0, 0, dependencies, null]);
        taskIDs[milestoneID] = true;
        //nodes.push({ ID: milestoneID, Name: 'End Milestone', Duration: '0'; Start: date.toISOString(), Finish: date.toISOString() }); // Add the End Node to the nodes array
    }
}

/**
 * Parses the XML to extract task data and dependencies.
 * @param {Object} xmlDoc - The XML document.
 * @param {Object} data - The Google visualization DataTable.
 */
function parseXML(xmlDoc, data) {
    console.log("parseXML called");
    // Store the XML data for future use
    xmlDocGlobal = xmlDoc;
    var root = xmlDoc.documentElement;
    console.log("Root element: ", root.nodeName);

    var minStartDate = new Date(2100, 0, 1); // a future date
    var maxEndDate = new Date(1900, 0, 1);   // a past date

    var tasks = xmlDoc.getElementsByTagName("Task");
    console.log("Number of tasks: ", tasks.length);

    var taskIDs = {}; // To keep track of task IDs
    var taskUIDtoID = {}; // To map UIDs to IDs
    var idIncrementRequired = false; //if there is a Task IDs with '0' it coincides theh our start node and all IDs must be incremented
    var selfReferencingTasks = [];

    // Initialize nodes and links arrays for the graph
    console.log("Initialize nodes and links arrays for the graph")
    var nodes = [];
    var links = [];

    // Initialize dependencyGraph and checkedTasks
    var dependencyGraph = {};
    var checkedTasks = {};

    var minDate = null;  // To keep track of the minimum start date

    var parsedTasks = [];

    // First pass to extract task IDs and UIDs
    var tasksData = [];
    for (var i = 0; i < tasks.length; i++) {
        // Initialize tasksData array to store task details
        //var parsedTask = parseTask(tasks[i], data, taskUIDtoID, idIncrementRequired, selfReferencingTasks);

        //tasksData.push(parsedTask);
        var uidElement = tasks[i].getElementsByTagName("UID")[0];
        var idElement = tasks[i].getElementsByTagName("ID")[0];

        if (uidElement && idElement) {
            var uid = uidElement.childNodes[0].nodeValue.trim();
            var id = idElement.childNodes[0].nodeValue.trim();
            taskUIDtoID[uid] = id;
            if (id === '0') {
                idIncrementRequired = true;
            }
        }
    }
    console.log('Log the taskUIDtoID', taskUIDtoID); // Log the taskUIDtoID
    console.log('Log the taskUIDtoID'); // Log the taskUIDtoID

    if (idIncrementRequired) {
        for (var uid in taskUIDtoID) {
            taskUIDtoID[uid] = (parseInt(taskUIDtoID[uid], 10) + 1).toString();
        }
    }

    // Find minimum date
    for (var i = 0; i < tasks.length; i++) {
        var startDateNode = tasks[i].getElementsByTagName("Start")[0];
        if (startDateNode) {
            var startDateText = startDateNode.childNodes[0].nodeValue.trim();
            var startDate = new Date(startDateText);  // Parse the date string
            if (!minDate || startDate < minDate) {
                minDate = startDate;
            }
        }
    }

    insertStartMilestone(data, nodes, taskIDs, minDate); // Insert Start Milestone after finding the minimum date.

    //Determine the Maximum ID:
    var maxID = -1;
    for (var i = 0; i < tasks.length; i++) {
        var taskIDElement = tasks[i].getElementsByTagName("ID")[0];
        if (taskIDElement && taskIDElement.childNodes[0]) {
            var taskID = parseInt(taskIDElement.childNodes[0].nodeValue.trim(), 10);
            if (idIncrementRequired) {
                taskID += 1;
            }
            maxID = Math.max(maxID, taskID);
        }
    }

    //Create the End Milestone:
    var endMilestoneID = maxID + 1;
    //nodes.push({ ID: endMilestoneID, Name: 'End Milestone', Start: 'someStartDate', Finish: 'someEndDate' });
    nodes.push({ ID: endMilestoneID, Name: 'End Milestone', Duration: '0', Start: maxEndDate, Finish: maxEndDate });
    //data.addRow([endMilestoneID, 'End Milestone', '', 'someStartDate', 'someEndDate', null, 100, null]);


    // Second pass to parse the tasks
    var successorCounts = {};
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var parsedTask = parseTask(tasks[i], data, taskUIDtoID, idIncrementRequired, selfReferencingTasks, minDate, maxEndDate);
        parsedTasks.push(parsedTask);

        var taskID = parsedTask.taskID;
        var taskName = task.getElementsByTagName("Name")[0].childNodes[0].nodeValue.trim();
        var startDate = task.getElementsByTagName("Start")[0].childNodes[0].nodeValue.trim();
        var endDate = task.getElementsByTagName("Finish")[0].childNodes[0].nodeValue.trim();
        var duration = parsedTask.duration;

        // Update minStartDate and maxEndDate
        var parsedStartDate = new Date(startDate);
        var parsedEndDate = new Date(endDate);
        if (parsedStartDate < minStartDate) {
            minStartDate = parsedStartDate;
        }
        if (parsedEndDate > maxEndDate) {
            maxEndDate = parsedEndDate;
        }

        // Add the task to the nodes array
        //nodes.push({ UID: taskID, Name: taskName, Start: startDate, Finish: endDate });
        nodes.push({ ID: taskID, Name: taskName, Duration: duration, Start: startDate, Finish: endDate }); //Using ID instead of UID

        console.log('Nodes', nodes)

        taskIDs[taskID] = true;
        var dependenciesNodeList = tasks[i].getElementsByTagName("PredecessorLink");
        for (var j = 0; j < dependenciesNodeList.length; j++) {
            var predecessorUIDNode = dependenciesNodeList[j].getElementsByTagName("PredecessorUID")[0];
            if (predecessorUIDNode) {
                var dependencyUID = predecessorUIDNode.childNodes[0].nodeValue.trim();
                var dependency = taskUIDtoID[dependencyUID];
                var dependencyID = taskUIDtoID[dependencyUID];
                // Log the values being used
                console.log("Dependency UID:", dependencyUID);
                console.log("Mapped Dependency ID (source):", dependencyID);
                console.log("Task ID (target):", taskID);
                console.log("Task duration:", duration);
                links.push({ source: dependencyID, target: taskID, duration: duration });
                if (!(taskID in dependencyGraph)) {
                    dependencyGraph[taskID] = [];
                }
                dependencyGraph[taskID].push(dependency);
            }
        }
        // Check if the task has no predecessors
        if (dependenciesNodeList.length === 0) {
            // Link the task with no predecessors to the Start Milestone (ID 0)
            links.push({ source: '0', target: taskID, duration: duration.toString() });
        }

        // Initialize successor counts
        successorCounts[taskID] = 0;

    }

    // Increment successor counts
    for (var i = 0; i < tasks.length; i++) {
        //var task = tasks[i];
        //var parsedTask = parseTask(tasks[i], data, taskUIDtoID, idIncrementRequired, selfReferencingTasks);
        var taskID = parsedTask.taskID;
        var dependenciesNodeList = tasks[i].getElementsByTagName("PredecessorLink");
        for (var j = 0; j < dependenciesNodeList.length; j++) {
            var predecessorUIDNode = dependenciesNodeList[j].getElementsByTagName("PredecessorUID")[0];
            if (predecessorUIDNode) {
                var dependencyUID = predecessorUIDNode.childNodes[0].nodeValue.trim();
                var dependencyID = taskUIDtoID[dependencyUID];
                // Increment successor count for each predecessor
                successorCounts[dependencyID]++;
            }
        }
    }

    // Connect Tasks Without Successors
    var tasksWithoutSuccessors = [];
    for (var taskID in successorCounts) {
        if (successorCounts[taskID] === 0) {
            links.push({ source: taskID, target: endMilestoneID, duration: duration });
            tasksWithoutSuccessors.push(taskID);
        }
    }

    console.log('Links', links);
    // Insert Start and End Milestones
    //insertStartMilestone(data, nodes, taskIDs, minStartDate);
    insertEndMilestone(endMilestoneID, data, nodes, taskIDs, maxEndDate, tasksWithoutSuccessors);

    // Third pass to check for invalid dependencies
    for (var i = 0; i < tasks.length; i++) {
        checkDependencies(tasks[i], taskIDs, taskUIDtoID, dependencyGraph);
    }

    // After constructing the entire dependency graph
    try {
        checkCycles(dependencyGraph);
    } catch (error) {
        console.error(error);
    }


    if (selfReferencingTasks.length > 0) {
        var warningMessage = "Self-referencing tasks found with IDs: " + selfReferencingTasks.join(", ");
        console.warn(warningMessage);
        document.getElementById('self-referencing-tasks-warning').innerText = warningMessage;
    }

    return { nodes: nodes, links: links, selfReferencingTasks: selfReferencingTasks, tasksData: tasksData };

}


function checkDependencies(task, taskIDs, taskUIDtoID, dependencyGraph) {
    var taskIDElement = task.getElementsByTagName("ID")[0];
    var taskID = taskIDElement.childNodes[0].nodeValue.trim();
    var dependencies = dependencyGraph[taskID] || [];
    for (var i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i];
        if (!taskIDs[dependency]) {
            throw new Error("Invalid task dependency ID: " + dependency + " in task with ID: " + taskID);

        }
    }
}

function detectCycle(graph, startNode, visited, recursionStack) {
    visited[startNode] = true;
    recursionStack[startNode] = true;

    var neighbors = graph[startNode];
    if (neighbors) {
        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];

            if (!visited[neighbor]) {
                if (detectCycle(graph, neighbor, visited, recursionStack)) {
                    return true;
                }
            } else if (recursionStack[neighbor]) {
                // if the neighbor node is visited and it's in the recursion stack, then it's a cycle
                return true;
            }
        }
    }

    recursionStack[startNode] = false; // remove the node from the recursion stack before returning
    return false;
}

function checkCycles(graph) {
    var visited = {};
    var recursionStack = {};

    function detectCycle(graph, startNode) {
        visited[startNode] = true;
        recursionStack[startNode] = true;

        var neighbors = graph[startNode];
        if (neighbors) {
            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];

                if (!visited[neighbor]) {
                    if (detectCycle(graph, neighbor)) {
                        return true;
                    }
                } else if (recursionStack[neighbor]) {
                    // if the neighbor node is visited and it's in the recursion stack, then it's a cycle
                    console.error("Cycle detected involving tasks with IDs: " + startNode + " and " + neighbor);
                    // Removing the cycle-causing dependency:
                    var index = graph[startNode].indexOf(neighbor);
                    if (index > -1) {
                        graph[startNode].splice(index, 1);
                    }
                    return false; // Remove the cycle but continue checking
                }
            }
        }

        recursionStack[startNode] = false; // remove the node from the recursion stack before returning
        return false;
    }

    for (var node in graph) {
        if (!visited[node]) {
            detectCycle(graph, node);
        }
    }
}

function parseTask(task, data, taskUIDtoID, idIncrementRequired, selfReferencingTasks, minDate, maxEndDate) {
    console.log("parseTask called");

    // Extract the data from the XML task element, with checks for missing elements

    var taskIDElement = task.getElementsByTagName("ID")[0];
    var taskNameElement = task.getElementsByTagName("Name")[0];
    var startDateElement = task.getElementsByTagName("Start")[0];
    var endDateElement = task.getElementsByTagName("Finish")[0];
    var durationElement = task.getElementsByTagName("Duration")[0];

    if (!taskIDElement || !taskNameElement || !startDateElement || !endDateElement || !durationElement) {
        throw new Error("Task element missing one or more expected child elements");
    }

    var taskID = taskIDElement.childNodes[0].nodeValue.trim();
    if (idIncrementRequired) {
        taskID = String(Number(taskID) + 1);
    }
    console.log("Task ID: ", taskID);


    var taskName = taskNameElement.childNodes[0].nodeValue.trim();
    console.log("Task Name: ", taskName);

    var startDateString = startDateElement.childNodes[0].nodeValue.trim();
    console.log("Start Date: ", startDateString);

    var endDateString = endDateElement.childNodes[0].nodeValue.trim();
    console.log("End Date: ", endDateString);

    var durationString = durationElement.childNodes[0].nodeValue.trim();
    console.log("Duration: ", durationString);

    // If PercentComplete element is missing, set it to "0"
    var percentCompleteElement = task.getElementsByTagName("PercentComplete")[0];
    var percentCompleteString = percentCompleteElement ? percentCompleteElement.childNodes[0].nodeValue.trim() : "0";
    console.log("Percent Complete: ", percentCompleteString);

    // When parsing dependencies, convert PredecessorUID into the corresponding ID
    var dependenciesNodeList = task.getElementsByTagName("PredecessorLink");
    var dependencies = [];

    for (var i = 0; i < dependenciesNodeList.length; i++) {
        var predecessorUIDNode = dependenciesNodeList[i].getElementsByTagName("PredecessorUID")[0];

        if (predecessorUIDNode) {
            var uid = predecessorUIDNode.childNodes[0].nodeValue.trim();
            if (taskUIDtoID[uid]) {
                dependencies.push(taskUIDtoID[uid]);
            }
        }
    }

    var dependenciesString = dependencies.length > 0 ? dependencies.join(",") : "None";
    console.log("Dependencies: ", dependenciesString);


    // Instead of throwing an error for invalid task ID, just log it and return
    if (isNaN(parseFloat(taskID))) {
        console.error("Invalid task ID value.");
        return;
    }

    // Validate date strings match expected format (yyyy-mm-dd or yyyy-mm-ddThh:mm:ss)
    var dateRegexShort = /^\d{4}-\d{2}-\d{2}$/;
    var dateRegexLong = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (startDateString.length === 10 && !dateRegexShort.test(startDateString) ||
        startDateString.length === 19 && !dateRegexLong.test(startDateString) ||
        endDateString.length === 10 && !dateRegexShort.test(endDateString) ||
        endDateString.length === 19 && !dateRegexLong.test(endDateString)) {
        throw new Error("Invalid date format in task with ID: " + taskID);

    }

    // Create dates from strings, and add error checking.
    var startDate = new Date(startDateString);
    var endDate = new Date(endDateString);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid task date format for taskID: " + taskID);
        return;
    }

    // Remove time portion of date if exists
    if (startDateString.length === 19) {
        startDate.setHours(0, 0, 0, 0);
    }
    if (endDateString.length === 19) {
        endDate.setHours(0, 0, 0, 0);
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid task date format.");
    }

    // Handle invalid duration values
    var duration;
    if (durationString.startsWith('PT')) {
        // Parse ISO 8601 duration format (PTxxHxxMxxS)
        var match = durationString.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        var hours = match[1] ? parseInt(match[1].slice(0, -1)) : 0;
        var minutes = match[2] ? parseInt(match[2].slice(0, -1)) : 0;
        var seconds = match[3] ? parseInt(match[3].slice(0, -1)) : 0;
        duration = hours + minutes / 60 + seconds / 3600;
    } else {
        duration = parseFloat(durationString);
    }
    if (isNaN(duration) || duration < 0) {
        console.error("Invalid task duration value for task with ID: " + taskID);
        return;
    }

    // Validate percent complete value, and handle invalid values.
    var percentComplete = parseFloat(percentCompleteString);
    if (isNaN(percentComplete) || percentComplete < 0 || percentComplete > 100) {
        console.error("Invalid task percent complete value for task with ID: " + taskID);
        return;
    }

    // Check the validity of dependency IDs and handle invalid values
    for (var i = 0; i < dependencies.length; i++) {
        if (isNaN(parseFloat(dependencies[i]))) {
            throw new Error("Invalid task dependencies format.");
        }
    }

    // Handle empty/missing dependency values
    if (dependencies.length === 0) {
        dependenciesString = "0";  // Here the startMilestoneID should be "0";
    } else {
        // Adjust dependencies array based on the incremented task IDs
        dependencies = dependencies.map(dependency => {
            if (dependency === "0") {
                return "1";
            } else {
                //return String(parseInt(dependency) + 1);
                return String(parseInt(dependency) + 0);
            }
        });

        // Convert dependencies array to a string with comma separated values
        dependenciesString = dependencies.join(",");
    }

    // Handle empty/missing dependency values and self-referencing tasks
    var hasOtherDependencies = false;
    for (var i = 0; i < dependencies.length; i++) {
        if (dependencies[i] === taskID) {
            console.warn("Task with ID: " + taskID + " has itself as a dependency. Removing the self-referencing dependency.");
            selfReferencingTasks.push(taskID);
        } else {
            hasOtherDependencies = true;
        }
    }
    if (dependencies.length === 0 || (!hasOtherDependencies && dependencies.includes(taskID))) {
        dependenciesString = "0";  // Default to the startMilestoneID if no valid dependencies
    } else {
        dependenciesString = dependencies.join(",");
    }

    // Add parsed task data to the DataTable.
    //console.log("Row: ", taskID, taskName, '', startDate, endDate, duration, percentComplete, dependenciesString);
    var maxEndDateObj = new Date(maxEndDate);
    var minDateObj = new Date(minDate);
    var endDateObj = new Date(endDate);
    var startDateObj = new Date(startDate);

    var totalDuration = (maxEndDateObj - minDateObj) / (1000 * 60 * 60 * 24);
    var taskDuration = (endDateObj - startDateObj) / (1000 * 60 * 60 * 24);

    var barWidthPercentage = totalDuration !== 0 ? (taskDuration / totalDuration) * 100 : 0;

    var progressBar = '<div class="progress-bar-container"><div class="progress-bar" style="width: ' + barWidthPercentage + '%;"></div></div>';

    //data.addRow([taskID, taskName, resource, taskStartDate, taskEndDate, taskDuration, percentComplete, dependencies, progressBar]);
    try {
        data.addRow([taskID, taskName, '', startDate, endDate, duration, percentComplete, dependenciesString, barWidthPercentage]);

    } catch (err) {
        console.error("Error adding row to DataTable for taskID: " + taskID);
        console.error(err.message);
        return;
    }

    return {
        taskID: taskID,
        duration: duration,
        taskName: taskName,
        startDate: startDate,
        endDate: endDate
    };
    // Return the task ID

}
function drawGanttChart(data) {
    console.log("drawGanttChart called");
    try {
        var numRows = data.getNumberOfRows();
        var height = numRows * 30 + 80;
        var options = {
            height: height,
            backgroundColor: '#cdfaff',
            gantt: {
                trackHeight: 30,
                barCornerRadius: 5,
                criticalPathEnabled: true,
                criticalPathStyle: {
                    stroke: '#1e69aa',
                    strokeWidth: 2
                },
                labelStyle: {
                    fontName: 'Orbitron',  // Futuristic font
                    fontSize: 14,
                    color: '#113464' // Dark blue text
                },
                barHeight: 25,
                percentEnabled: false,
                shadowEnabled: true,
                arrow: {
                    angle: 90,  // Make links less curvy
                    width: 2,
                    color: '#195a8c',
                    length: 10
                },
                defaultStartDate: null,
                palette: [
                    {
                        color: {
                            linearGradient: { x0: 0, y0: 0, x1: 0, y1: 1 },
                            colorStops: [{ offset: 0, color: '#3292cd' }, { offset: 1, color: '#287dc8' }]
                        },
                        dark: '#113464',
                        stroke: '#195a8c',
                        strokeWidth: 2
                    }
                ],
                gridlines: {
                    color: '#3292cd'
                },
                minorGridlines: {
                    color: '#287dc8',
                    count: 15
                },
                labelMaxWidth: 300, // Increase if labels are long
                labelTextStyle: {
                    fontName: 'Orbitron',
                    fontSize: 14,
                    color: '#113464'
                },
                tooltip: {
                    isHtml: true
                }
            },
            chartArea: {
                backgroundColor: '#cdfaff'
            },
            hAxis: {
                textStyle: {
                    fontName: 'Orbitron',
                    color: '#1e69aa'
                },
                gridlines: {
                    color: '#287dc8'
                }
            },
            vAxis: {
                textStyle: {
                    fontName: 'Orbitron',
                    color: '#1e69aa'
                }
            }
        };
        var chart = new google.visualization.Gantt(document.getElementById('chart_div'));
        chart.draw(data, options);
    } catch (err) {
        console.error(err);
    }
}
// Completion of all computations and renderings
updateProgressBar(100);
document.querySelector(".sci-fi-loading-text").innerText = "";