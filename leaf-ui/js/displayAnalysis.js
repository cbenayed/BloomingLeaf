/**
 * This file contains functions that help display the analysis
 * that the web application would receive from the back end.
 * It also contains functions for the analysis configuration sidebar
 */

// Analysis Configuration map (key: configId, value: analysisConfig object)
var analysisMap = new Map();
// Global variable to keep track of what analysis configuration is currently being used
var currAnalysisConfig;

/**
 * Displays the analysis to the web app, by displaying the slider and the
 * history log
 *
 * @param {Object} analysisResults
 *   Object which contains data gotten from back end
 */
function displayAnalysis(analysisResults){

    // Change the format of the analysis result from the back end
    var currentAnalysis = new analysisObject.initFromBackEnd(analysisResults);
    currentAnalysis.type = "Single Path";

    // Save data for get possible next states
    // TODO double check this still works
    savedAnalysisData.singlePathResult = analysisResults;

    // Check if slider has already been initialized
    if (sliderObject.sliderElement.hasOwnProperty('noUiSlider')) {
        sliderObject.sliderElement.noUiSlider.destroy();
    }
    createSlider(currentAnalysis, false);
}

/**
 * Creates a slider and displays it in the web app
 *
 * @param {Object} currentAnalysis
 *   Contains data about the analysis that the back end performed
 * @param {number} currentValueLimit
 * @param {Boolean} isSwitch
 *   True if the slider is being created when we are switching analysis's
 *   with the history log, false otherwise
 */
function createSlider(currentAnalysis, isSwitch) {

    var sliderMax = currentAnalysis.timeScale;
    analysisResult.maxTimePoint = sliderMax;
    var density = (sliderMax < 25) ? (100 / sliderMax) : 4;

    noUiSlider.create(sliderObject.sliderElement, {
        start: 0,
        step: 1,
        behaviour: 'tap',
        connect: 'lower',
        direction: 'ltr',
        range: {
            'min': 0,
            'max': sliderMax
        },
        pips: {
            mode: 'values',
            values: [],
            density: density
        }
    });

    // Set initial value of the slider
    sliderObject.sliderElement.noUiSlider.set(isSwitch ? 0 : sliderMax);
    sliderObject.sliderElement.noUiSlider.on('update', function( values, handle ) {
        updateSliderValues(parseInt(values[handle]), currentAnalysis);
    });
    EVO.setCurTimePoint(sliderMax);
    adjustSliderWidth(sliderMax);
}

/*
 * Creates and displays new slider after the user clicks a different
 * analysis from the history log. This function is called when
 * the user clicks a different analysis from the history log.
 *
 * @param {Object} currentAnalysis
 *   Contains data about the analysis that the back end performed
 * @param {Number} historyIndex
 *   A valid index for the array historyObject.allHistory, indicating
 *   which analysis/history log that the user clicked on
 */
function switchHistory(currentAnalysis) {

    sliderObject.sliderElement.noUiSlider.destroy();
    createSlider(currentAnalysis, true);
}


/**
 * Adjusts the width of the slider depending on the width of the paper
 *
 * @param {Number} maxValue
 *   The maximum value for the current slider
 */
function adjustSliderWidth(maxValue){
    // Min width of slider is 15% of paper's width
    var min = $('#paper').width() * 0.1;
    // Max width of slider is 90% of paper's width
    var max = $('#paper').width() * 0.6;
    // This is the width based on maxvalue
    var new_width = $('#paper').width() * maxValue / 100;
    // new_width is too small or too large, adjust
    if (new_width < min){
        new_width = min;
    }
    if (new_width > max){
        new_width = max;
    }
    $('#slider').width(new_width);
}

/**
 * Updates the slider values at the bottom left hand side of the paper,
 * to represent the current slider's position.
 *
 * @param {Number} sliderValue
 *   Current value of the slider
 * @param {Number} currentValueLimit
 * @param {Object} currentAnalysis
 *   Contains data about the analysis that the back end performed
 */
function updateSliderValues(sliderValue, currentAnalysis){

    analysisResult.selectedTimePoint = sliderValue;

    var value = sliderValue;
    $('#sliderValue').text(value);
    sliderObject.sliderValueElement.innerHTML = value + "|" + currentAnalysis.relativeTime[value];
    // Update the analysisRequest current state.
    analysisRequest.currentState = sliderObject.sliderValueElement.innerHTML;

	for (var i = 0; i < currentAnalysis.numOfElements; i++) {
		var element = currentAnalysis.elements[i];
		updateNodeValues(element.id, element.status[value]);
    }
    
    EVO.setCurTimePoint(value);
}


/**
 * Updates the satisfaction value of a particular node in the graph.
 * Used to display analysis results on the nodes.
 *
 * @param {String} nodeID
 *   nodeID of the node of interest
 * @param {String} satValue
 *   Satisfaction value in string form. ie: '0011' for satisfied
 */
function updateNodeValues(nodeID, satValue) {
	var elements = graph.getElements();
	var curr;
	var cell;
	for (var i = 0; i < elements.length; i++) {
		curr = elements[i].findView(paper).model;
		if (curr.attributes.nodeID == nodeID) {
			cell = curr;
			break;
		}
	}

	if ((cell != null) && (satValue in satisfactionValuesDict)) {
        cell.attr(".satvalue/text", satisfactionValuesDict[satValue].satValue);
        cell.attr({text: {fill: 'white'}});//satisfactionValuesDict[satValue].color
    }
}


/**
 * Display history log
 *
 */
$('#history').on("click", ".log-elements", function(e){
    var txt = $(e.target).text();
    var step = parseInt(txt.split(":")[0].split(" ")[1]);
    var log = historyObject.allHistory[step - 1];
    var currentAnalysis = log.analysis;

    switchHistory(currentAnalysis);

    $(".log-elements:nth-of-type(" + historyObject.currentStep.toString() +")").css("background-color", "");
    $(e.target).css("background-color", "#E8E8E8");

    historyObject.currentStep = step;
});


/**
 * Clears the history log on the web application, and clears
 * historyObject to its inital state
 */
function clearHistoryLog(){

    $('.log-elements').remove();

    if (sliderObject.sliderElement.noUiSlider) {
        sliderObject.sliderElement.noUiSlider.destroy();
    }

    sliderObject.pastAnalysisValues = [];

    historyObject.allHistory = [];
    historyObject.currentStep = null;
    historyObject.nextStep = 1;
}


/**
 * Updates history log in order to display the new analysis,
 * and updates the historyObject to store information about
 * the new analysis.
 *
 * @param {Object} currentAnalysis
 *   Contains data about the analysis that the back end performed
 * @param {Number} currentValueLimit
 */
function updateHistory(currentAnalysis){
    var logMessage = "Step " + historyObject.nextStep.toString() + ": " + currentAnalysis.type;
    logMessage = logMessage.replace("<", "&lt");

    if ($(".log-elements")) {
        $(".log-elements").last().css("background-color", "");
    }

    $("#history").append("<a class='log-elements' style='background-color:#E8E8E8''>" + logMessage + "</a>");

    historyObject.currentStep = historyObject.nextStep;
    historyObject.nextStep++;

    var log = new logObject(currentAnalysis, 0);
    historyObject.allHistory.push(log);
}

/**
 * Function to set up the initial analysis configuration upon page load
 */
function addFirstAnalysisConfig(){
    $(".log-elements").css("background-color", "");
    $(".result-elements").css("background-color", "");
    var id = "Configuration1"
    currAnalysisConfig = new AnalysisConfiguration(id, analysisRequest);
    analysisMap.set(id, currAnalysisConfig);
    // Currently necessary for User Assignments List preservation
    defaultUAL = currAnalysisConfig.userAssignmentsList;
    // Add the empty first config to the UI
    addAnalysisConfig(currAnalysisConfig);
}

/**
 * Function to load analysis configurations and results from JSON into the config sidebar
 * TODO: before running, wipe all other variables and analysis sidebars 
 * so that we can load a new thing after running others
 */
function loadAnalysis(){
    // Loop through each configuration
	for(let config of analysisMap.values()) {
        // Add the config to the sidebar
        addAnalysisConfig(config);
        // Add the results (if any) to the sidebar
        loadResults(config);
    }
    firstConfigElement = document.getElementById('configurations').childNodes[0];
    currAnalysisConfig = analysisMap.get(firstConfigElement.id);
    // Set default UAL to preserve in future configs
    defaultUAL = currAnalysisConfig.userAssignmentsList;
    analysisRequest = currAnalysisConfig.analysisRequest;
    
    switchConfigs(firstConfigElement);
    // Refresh the sidebar to include the config vars
    refreshAnalysisUI();
}

/**
 * Adds a new analysis configuration to the Config sidebar
 */
function addNewAnalysisConfig(){
    // Update current config with current analysisRequest and set the udpated config in map
    currAnalysisConfig.updateAnalysis(analysisRequest);
    analysisMap.set(currAnalysisConfig.id, currAnalysisConfig);

    // Figure out number of new config, name and create it, and then add it to the map
    var id = "Configuration" + (analysisMap.size+1).toString()
    
    // default Analysis Request needed for now for user assignments list
    // TODO: Look into perserving base UAL throughout analysisRequests
    var newRequest = new AnalysisRequest();
    defaultUAL.forEach(userEval => newRequest.userAssignmentsList.push(userEval));

    var newConfig = new AnalysisConfiguration(id, newRequest);
    analysisMap.set(id, newConfig);

    // Update current config to be the new config, and update analysisRequest to match new config
    currAnalysisConfig = newConfig;
    analysisRequest = currAnalysisConfig.getAnalysisRequest();

    // Reset analysis sidebar to default
    refreshAnalysisUI();
    // Add the config to the sidebar
    addAnalysisConfig(currAnalysisConfig);
}

/**
 * Adds an analysis configuration to the UI (config sidebar)
 */
function addAnalysisConfig(config) {
    $(".log-elements").css("background-color", "");
    $(".result-elements").css("background-color", "");

    // Add config to config container
    $("#configurations").append(getHTMLString(config.id));
    mainElement = document.getElementById(config.id);
    mainElement.querySelector('.log-elements').addEventListener('dblclick', function(){rename(this)});
    mainElement.querySelector('.log-elements').addEventListener('click', function(){switchConfigs(this.parentElement)});
    mainElement.querySelector('.dropdown-button').addEventListener('click', function(){toggleDropdown(this.parentElement.parentElement.querySelector('.dropdown-container'))})
}

/**
 * Removes an analysis configuration from the analysisMap and UI sidebar
 * TODO implement with a button
 */
function removeConfiguration() {
    // Remove full configuration div (includes results)
    var configDiv = document.getElementById(currAnalysisConfig.id);
    configDiv.remove();
    // Remove config from analysisMap
    analysisMap.delete(currAnalysisConfig.id);
}

/**
 * Clears the analysis config sidebar
 */
function clearAnalysisConfigSidebar() {
    // Remove all child elements of the configurations div
    $('#configurations').empty();
}

/**
 * Loads in results to the UI menu when file is being loaded into BloomingLeaf
 */
function loadResults(config){
    $(".result-elements").css("background-color", "");
    var id = config.id;

    var dropdownElement = document.getElementById(id).querySelector('.dropdown-container');
    // clear all results from dropdown (prevents duplication)
    dropdownElement.innerHTML = "";
    var resultCount = analysisMap.get(id).analysisResults.length;

    // Loop through and add all results
    for (var i=0; i < resultCount; i++) {
        dropdownElement.insertAdjacentHTML("beforeend","<a class='result-elements' id='"+i+"'>" + "Result " + (i+1) + "</a>");
    }
    const results = dropdownElement.querySelectorAll('.result-elements');
    results.forEach(function(result){
        result.addEventListener('click', function(){switchResults(result, result.parentElement.parentElement)});
    });

    // Highlight last result
    $(dropdownElement.lastChild).css("background-color", "#A9A9A9");

}
/**
 * Adds result to UI menu
 */
function updateResults(){
    $(".result-elements").css("background-color", "");
    var id = currAnalysisConfig.id;

    // clear all results from dropdown (prevents duplication)
    var dropdownElement = document.getElementById(id).querySelector('.dropdown-container');
    var resultCount = analysisMap.get(currAnalysisConfig.id).analysisResults.length;
    dropdownElement.insertAdjacentHTML("beforeend","<a class='result-elements' id='"+(resultCount-1)+"'>" + "Result " + (resultCount) + "</a>");

    dropdownElement.lastChild.addEventListener('click', function(){switchResults(this, this.parentElement.parentElement)});

    // highlight newest/last result
    $(dropdownElement.lastChild).css("background-color", "#A9A9A9");
    
}

/**
 * Refreshes analysisRequest values in the UI 
 * in places such as the right sidebar and absolute time points field
 */
function refreshAnalysisUI(){
    $('#abs-time-pts').val(analysisRequest.absTimePtsArr);
    $('#conflict-level').val(analysisRequest.conflictLevel);
    $('#num-rel-time').val(analysisRequest.numRelTime);
}

function rename(configElement){
    var configContainerElement = configElement.parentElement;
    var element = $(configElement);
    var input = $('<input>').attr("id", "configInput").val( element.text());
    element.replaceWith(input);
    console.log(element);
    input.focus();
    document.getElementById("configInput").addEventListener("keyup", function(e){
        if (e.key == "Enter"){
            setConfigName(configContainerElement, configElement, this);
        }
    })
}

function setConfigName(configContainerElement, configElement, inputElement){
    if(analysisMap.has(inputElement.value) && inputElement.value != configContainerElement.id){
        console.log("Name taken error - add popup for this");
        return;
    }
    console.log(configContainerElement)
    config = analysisMap.get(configContainerElement.id);
    analysisMap.delete(configContainerElement.id);
    config.updateId(inputElement.value);
    analysisMap.set(inputElement.value, config);
    console.log(analysisMap);
    configContainerElement.id = inputElement.value;
    configElement.innerHTML = inputElement.value;

    inputElement.replaceWith(configElement);
}

function switchConfigs(configElement){
    currAnalysisConfig.updateAnalysis(analysisRequest);
    analysisMap.set(currAnalysisConfig.id, currAnalysisConfig);

    currAnalysisConfig = analysisMap.get(configElement.id);
    analysisRequest = currAnalysisConfig.getAnalysisRequest();
    refreshAnalysisUI();
    
    $(".log-elements").css("background-color", "");
    $(".result-elements").css("background-color", "");
    $(configElement.querySelector('.log-elements')).css("background-color", "#A9A9A9");

}

/**
 * Ties Results to update UI and show associated results on click action
 */
function switchResults(resultElement, configElement){
    var currAnalysisId = configElement.id;
    currAnalysisConfig = analysisMap.get(currAnalysisId);
    var currAnalysisResults = currAnalysisConfig.analysisResults[resultElement.id];
    analysisRequest = currAnalysisConfig.getAnalysisRequest();

    // Update UI accordingly
    $(".result-elements").css("background-color", "");
    $(".log-elements").css("background-color", "");
    $(resultElement).css("background-color", "#A9A9A9");
    $(configElement.querySelector(".log-elements")).css("background-color","#A9A9A9");
    refreshAnalysisUI();
    displayAnalysis(currAnalysisResults);
}

/**
 * Ties dropdown bar to open or close on click action
 */
function toggleDropdown(dropdownContainer){
    if (dropdownContainer.style.display !== "none") {
        dropdownContainer.style.display = "none";
        } else {
        dropdownContainer.style.display = "block";
        }
    
}

/**
 * Creates HTML string to be appended when adding configurations
 */
function getHTMLString(id){
    return'<div class = "analysis-configuration" id="' + id + '">' +
            '<button class="log-elements" style="background-color:#A9A9A9;">' 
            + id + '</button>' +
            '<div style="position:absolute; display:inline-block">'+
            '<button class="dropdown-button">'+
                '<i class="fa fa-caret-down fa-2x" style="cursor:pointer;"></i>'+
            '</button>' +
            '</div>'+
            '<div class="dropdown-container"></div>' +
           '</div>';
}

/**
 * Adds a new AnalysisConfig
 */
$('.addConfig').on('click', function(){
    addNewAnalysisConfig();
});

