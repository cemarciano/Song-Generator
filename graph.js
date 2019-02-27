var network, data;
var windowInterval;
var options = {
	layout:{randomSeed:30},
	physics: {enabled: false}
};
var nodeColor = "#ffffff";			// Background color of non-sink nodes
var nodeFontColor = "#000000";		// Font color of non-sink nodes
var sinkColor = "#000000";			// Background color of sink nodes
var sinkFontColor = "#ffffff";		// Font color of sink nodes
var container;						// Network DOM object
var music = [];						// Music object for each node
var backing;						// Backing track object
var musicFadeOut = 400;				// Music fade (ms)
var serInterval = 4780;				// Waiting interval before next edge reversal (ms)
var poliphonyVolume = 0.28;			// Volume for poliphony tracks
var songsLoaded = 0;				// Counter of how many tracks have been loaded

// Variables for visual placement of nodes:
var rowDist = 110;				// Distance between rows
var colDist = 130;				// Distance between columns
var transitSpacing = 30;		// Extra distance from central transitional nodes

// create an array with nodes
var nodes = new vis.DataSet([
	{id: 1, label: '1', x: -(colDist + transitSpacing), y: -rowDist, file:"antec01"},
	{id: 2, label: '2', x: -(2*colDist + transitSpacing), y: -rowDist, file:"conseq01"},
	{id: 3, label: '3', x: -(2.8*colDist + transitSpacing), y: 0, file:"antec02"},
	{id: 4, label: '4', x: -(3.4*colDist + transitSpacing), y: -rowDist-15, file:"conseq02"},
	{id: 5, label: '5', x: -(2*colDist + transitSpacing), y: rowDist, file:"conseq03"},
	{id: 6, label: '6', x: -(colDist + transitSpacing), y: rowDist, file:"antec03"},
	{id: 7, label: '7', x: 0, y: rowDist},
	{id: 8, label: '8', x: colDist + transitSpacing, y: rowDist},
	{id: 9, label: '9', x: 2*colDist + transitSpacing, y: rowDist+55},
	{id: 10, label: '10', x: 2*colDist + transitSpacing, y: rowDist-55},
	{id: 11, label: '11', x: 3*colDist + transitSpacing, y: rowDist},
	{id: 12, label: '12', x: 3*colDist + transitSpacing, y: -rowDist+80},
	{id: 13, label: '13', x: 2*colDist + transitSpacing, y: -rowDist},
	{id: 14, label: '14', x: colDist + transitSpacing, y: -rowDist},
	{id: 15, label: '15', x: 0, y: -rowDist}
]);


// create an array with edges
var edges = new vis.DataSet([
	{from: 15, to: 1},
	{from: 2, to: 1},
	{from: 5, to: 1},
	{from: 3, to: 2},
	{from: 6, to: 2},
	{from: 4, to: 3},
	{from: 5, to: 3},
	{from: 6, to: 5},
	{from: 7, to: 6},
	{from: 8, to: 7},
	{from: 9, to: 8},
	{from: 10, to: 8},
	{from: 11, to: 9},
	{from: 11, to: 10},
	{from: 12, to: 11},
	{from: 13, to: 11},
	{from: 14, to: 12},
	{from: 14, to: 13},
	{from: 15, to: 14}

]);




// Startup function:
function createNetwork(){
	// Adds arrow information to edges:
	edges.forEach(function(item){
		item.arrows = "to";
		edges.update(item);
	});
	// Creates network:
	container = document.getElementById('mynetwork');
	data = {
		nodes: nodes,
		edges: edges
	};
	network = new vis.Network(container, data, options);
	network.moveTo({scale: 1.4});
	// Updates who is sink:
	_updateSinks();
	// Initializes sound files:
	_initializeSongs();
	// Updates colors of nodes:
	_updateColors();

	// Only start system after everything has loaded:
	windowInterval = setInterval(function(){
		if (songsLoaded == 6){
			// Remove interval:
			clearInterval(windowInterval);
			// Removes loading screen:
			document.getElementById('loading-screen').remove();
			// Perform first round of SER and play first songs:
			setTimeout(function(){
				_playSongs();
				setInterval(function(){
					runSER();
				},serInterval);
			}, 700);
		}
	}, 1000);


}


// Function to perform a synchronous round of SER:
function runSER(){
	// Recalculates who is sink:
	_updateSinks();
	// Performs edge reversal of all sinks:
	let sinks = nodes.forEach(function(item){
		if (item.sink == true){
			_revertEdge(item.id);
		}
	});
	// Recalculates who is sink:
	_updateSinks();
	_updateColors();
	_playSongs();
}




// Performs edge-reversal on node with id *sink*:
function _revertEdge(sink) {
	// Finds desired edge:
	let edge = edges.get({
		filter: function (item) {
    		return ((item.from == sink) || (item.to == sink));
		}
  	});
	// Reverts edge:
	edge.forEach(function(item){
		if (item["from"] == sink){
			let temp = item["from"];
			item["from"] = item["to"];
			item["to"] = temp;
		} else {
			let temp = item["to"];
			item["to"] = item["from"];
			item["from"] = temp;
		}
	});
	// Pushes the update:
	edges.update(edge);
}


// Helper function to mark who is sink:
function _updateSinks(){
	// Sets everyone as sinks:
	nodes.forEach(function(item){
		item.sink = true;
		nodes.update(item);
	});
	// Runs through edges and unmark non-sinks:
	edges.forEach(function(item){
		nodes.update({id: item["from"], sink: false});
	});
}

// Updates colors of nodes:
function _updateColors(){
	nodes.forEach(function(item){
		if (item.sink == true){
			item.color = {};
			item.color.background = sinkColor;
			item.color.border = nodeFontColor;
			item.font = {};
			item.font.color = sinkFontColor;
			nodes.update(item);
		} else {
			item.color = {};
			item.color.background = nodeColor;
			item.color.border = nodeFontColor;
			item.font = {};
			item.font.color = nodeFontColor;
			nodes.update(item);
		}
	});
}

// Initializes sound files:
function _initializeSongs(){
	// Initializes node music:
	nodes.forEach(function(item){
		music[item.id] = new Howl({
			src: ['phrases/' + item.file + '.mp3'],
			autoplay: false,
			loop: false,
			preload: true
		});
		// Let us know when it loads:
		music[item.id].once("load", function(){
			// Increments the counter of total songs loaded:
			songsLoaded++;
			console.log(songsLoaded);
		});
	});
	// Initializes backing track:
	backing = new Howl({
		src: ['phrases/backing.mp3'],
		autoplay: false,
		loop: true,
		preload: true,
		volume: 0.55
	});
	// Let us know when it loads:
	backing.once("load", function(){
		// Increments the counter of total songs loaded:
		songsLoaded++;
		console.log(songsLoaded);
	});
}



// Play sound files associated with sinks:
function _playSongs(){
	// If backing is not playing, play it:
	if (backing.playing() == false){
		backing.play();
	}
	var firstPlayed = true;
	// Play sound of sinks:
	nodes.forEach(function(item){
		if (item.sink == true){
			music[item.id].play();
			// If this is the first sink playing in this orientation:
			if (firstPlayed){
				// Make it stand out:
				music[item.id].volume(1);
				firstPlayed = false;
			} else {
				music[item.id].volume(poliphonyVolume);
			}
		}
	});
}

createNetwork();
