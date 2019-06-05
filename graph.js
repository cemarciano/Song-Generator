var network, bordersNetwork;			// Network objects
var data, bordersData, edges;			// Networks data
var container, borders;					// Networks DOM object
var options = {							// Networks initialization options
	layout:{randomSeed:30},
	physics: {enabled: false},
	interaction: {
		dragNodes: false,
		dragView: false,
		zoomView: false
	},
	autoResize: true
};
var nodeColor = "#ffffff";				// Background color of non-sink nodes
var nodeFontColor = "#000000";			// Font color of non-sink nodes
var sinkColor = "#000000";				// Background color of sink nodes
var sinkFontColor = "#ffffff";			// Font color of sink nodes
var music = [];							// Music object for each node
var backings = [undefined,undefined];	// Array of backing tracks
var backing;							// Backing track object
var musicFadeOut = 400;					// Music fade (ms)
var serInterval = [null, 4.815, 6.430];	// Waiting interval before next edge reversal (ms) sorted by genre (first is blues, second is jazz)
var poliphonyVolume = 0.55;				// Volume for poliphony tracks
var phraseVolume = 0.9;					// Volume for single phrases
var backingVolume = 1;					// Volume for backing track
var songsLoaded = 0;					// Counter of how many tracks have been loaded
var currentGenre;						// Starting genre. 1 is blues, 2 is jazz. Defined by play function
var serIterations = 0;					// Gets incremented by 1 everytime SER iterates
var playingNodes = [];					// Array of indexes of nodes being played
var isTransitioning = false;			// True if a transitional node is playing
var currentScale = 1.33;				// Current scaling for network size
var transitionOffset = 0.2;				// When transitioning genres, a delay is genrated. This will add to a node's offset to correct it
var transitRate = 1;					// This modifies transition play rates so that they may be played outside their original genres

// Variables for visual placement of nodes:
var rowDist = 110;				// Distance between rows
var colDist = 130;				// Distance between columns
var transitSpacing = 30;		// Extra distance from central transitional nodes

// create an array with nodes (offset measured in seconds)
var nodes = new vis.DataSet([
	{id: 1, label: 'A', x: -(colDist + transitSpacing), y: -rowDist, file:"antec01", noteCount: 8, offset: -0.8},
	{id: 2, label: 'C', x: -(2*colDist + transitSpacing), y: -rowDist, file:"conseq01", noteCount: 12, offset: -0.33},
	{id: 3, label: 'A', x: -(2.8*colDist + transitSpacing), y: 0, file:"antec03", noteCount: 11, offset: -1.49},
	{id: 4, label: 'C', x: -(3.4*colDist + transitSpacing), y: -rowDist, file:"conseq02", noteCount: 14, offset: -3.6},
	{id: 5, label: 'C', x: -(2*colDist + transitSpacing), y: rowDist, file:"conseq03", noteCount: 8, offset: -2.45},
	{id: 6, label: 'A', x: -(colDist + transitSpacing), y: rowDist, file:"antec02", noteCount: 1, offset: -1},
	{id: 7, label: 'T', x: 0, y: rowDist, transitional: true, file:"trans01", noteCount: "N/A", offset: -1.43, genre: 1},
	{id: 8, label: 'A', x: colDist + transitSpacing, y: rowDist, file:"jazz-antec03", noteCount: 7, offset: -2.19},
	{id: 9, label: 'C', x: 2*colDist + transitSpacing, y: rowDist+55, file:"jazz-conseq01", noteCount: 6, offset: -2.15},
	{id: 10, label: 'C', x: 2*colDist + transitSpacing, y: rowDist-55, file:"jazz-conseq02", noteCount: 6, offset: -1.8},
	{id: 11, label: 'A', x: 3*colDist + transitSpacing, y: rowDist, file:"jazz-antec02", noteCount: 16, offset: -1.52},
	{id: 12, label: 'C', x: 3*colDist + transitSpacing, y: -rowDist+80, file:"jazz-conseq03", noteCount: 14, offset: -2.95},
	{id: 13, label: 'C', x: 2*colDist + transitSpacing, y: -rowDist, file:"jazz-conseq04", noteCount: 14, offset: -2.95},
	{id: 14, label: 'A', x: colDist + transitSpacing, y: -rowDist, file:"jazz-antec01", noteCount: 12, offset: -2.1},
	{id: 15, label: 'T', x: 0, y: -rowDist, transitional: true, file:"trans02", noteCount: "N/A", offset: -2.07, genre: 2}
]);


// Orient max cycle in the counterclockwise direction:
var counterclockwiseEdges = new vis.DataSet([
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

// Orient max cycle in the clockwise direction:
var clockwiseEdges = new vis.DataSet([
	{from: 15, to: 1},
	{from: 1, to: 2},
	{from: 1, to: 5},
	{from: 2, to: 3},
	{from: 2, to: 6},
	{from: 4, to: 3},
	{from: 3, to: 5},
	{from: 5, to: 6},
	{from: 6, to: 7},
	{from: 7, to: 8},
	{from: 8, to: 9},
	{from: 8, to: 10},
	{from: 9, to: 11},
	{from: 10, to: 11},
	{from: 11, to: 12},
	{from: 11, to: 13},
	{from: 12, to: 14},
	{from: 13, to: 14},
	{from: 15, to: 14}

]);

// Borders (blues, jazz, transit):
var borderNodes = new vis.DataSet([
	{id: 1, image: "border1.png", x: 0, y: 0, shape: "image", size: 62.5},
	{id: 12, image: "border2.png", x: -(2.1*colDist + transitSpacing), y: 0, shape: "image", size: 163},
	{id: 13, image: "border3.png", x: (1.92*colDist + transitSpacing), y: rowDist/5, shape: "image", size: 185}
]);
var borderEdges = new vis.DataSet([]);




// Startup function:
function createNetwork(){
	// Select the default set of edges to use:
	edges = counterclockwiseEdges;
	// Adds arrow information to edges:
	edges.forEach(function(item){
		item.arrows = "to";
		edges.update(item);
	});
	// Updates node colors:
	_updateColors();
	// Creates borders:
	borders = document.getElementById('borders');
	bordersData = {
		nodes: borderNodes,
		edges: borderEdges
	};
	bordersNetwork = new vis.Network(borders, bordersData, options);
	bordersNetwork.moveTo({scale: currentScale});
	// Creates network:
	container = document.getElementById('main-network');
	data = {
		nodes: nodes,
		edges: edges
	};
	network = new vis.Network(container, data, options);
	network.moveTo({scale: currentScale});
	// Updates who is sink:
	_updateSinks();
	// Initializes sound files:
	_initializeSongs();

}


// Function to be executed when the Play button is pressed:
function play(genre){
	// Removes loading screen:
	document.getElementById('loading-screen').remove();
	// Sets current genre:
	currentGenre = genre;
	// Adds arrow information to edges:
	if (genre == 2){
		edges = clockwiseEdges;
		// Adds arrow information to edges:
		edges.forEach(function(item){
			item.arrows = "to";
			edges.update(item);
		});
		network.setData({nodes:nodes, edges:edges});
		network.moveTo({scale: currentScale});
	}
	// Updates who is sink:
	_updateSinks();
	// Updates node colors:
	_updateColors();
	// Perform first round of SER and play first songs:
	setTimeout(function(){
		requestAnimationFrame(fire);
	}, 700);
}

// Main recurring function, being called every keyframe:
function fire(){
	// Checks if next iteration of SER should occur:
	if(backings[currentGenre].seek() >= (serInterval[currentGenre]*(serIterations-1) + serInterval[currentGenre]*transitRate)){
		// Checks if a transition has just taken place:
		if (isTransitioning == true){
			// Stops current backing track:
			backings[currentGenre].stop();
			// Switches genres:
			_switchGenre();
			// Resets state variable:
			isTransitioning = false;
			// Resets transition rate:
			transitRate = 1;
			// Resets the number of SER iterations:
			serIterations = 0;
		}
		// Checks if this is the first time running:
		if (playingNodes.length == 0){
			// Run next round of SER without reverting edges:
			runSER(true);
		} else {
			// Run next round of SER:
			runSER(false);
		}
		// Increments current phrase count:
		serIterations++;
		// Updates DOM interval value:
		document.getElementById("interval-value").innerHTML = serInterval[currentGenre];
	}
	// Repeat itself:
	requestAnimationFrame(fire);
}


// Resumes execution of backing track when this window becomes active:
window.addEventListener('focus', function(){
	// Impedes this from triggering during loading screens:
	if (serIterations > 0){
		// Checks if backing track was previously active:
		if (backings[currentGenre].seek() != 0){
			// Plays backing track:
			backings[currentGenre].play();
		}
		// Plays phrases:
		playingNodes.forEach(function(index){
			music[index].play();
		});
		// Resume dynamic:
		requestAnimationFrame(fire);
	}
});
// Stops execution of backing track when this window becomes inactive:
window.addEventListener('blur', function(){
	// Impedes this from triggering during loading screens:
	if (serIterations > 0){
		// Pauses backing track:
		backings[currentGenre].pause();
		// Pauses phrases:
		playingNodes.forEach(function(index){
			music[index].pause();
		});
	}
});


// Function to perform a synchronous round of SER:
function runSER(firstReversal){
	// Recalculates who is sink:
	_updateSinks();
	// Performs edge reversal of all sinks:
	let sinks = nodes.forEach(function(item){
		if ((item.sink == true) && (firstReversal == false)){
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
			_incrementSongsLoaded();
		});
	});
	// Initializes backing tracks:
	for (let i=1; i<=2; i++){
		backings[i] = new Howl({
			src: ['phrases/backing0'+i+'.mp3'],
			autoplay: false,
			loop: true,
			preload: true
		});
		// Let us know when it loads:
		backings[i].once("load", function(){
			// Increments the counter of total songs loaded:
			_incrementSongsLoaded();
		});
	}
}


function _incrementSongsLoaded(){
	// Increments the counter of total songs loaded:
	songsLoaded++;
	// Updates songs loaded visual count:
	document.getElementById("songs-loaded").innerHTML = songsLoaded;
	// Checks if all songs have been loaded:
	if (songsLoaded == 17){
		// Display Play buttons after a few seconds:
		setTimeout(function(){
			// Fetches loading screen:
			var loadingScreenText = document.getElementById('loading-screen-text');
			// Removes Loading... text:
			loadingScreenText.innerHTML = "";
			// Displays play buttons:
			var playButtons = document.getElementsByClassName("btn");
			for (var i = 0; i < playButtons.length; i++){
				playButtons[i].style.display = "block";
			}
		}, 900);
	}
}


// Play sound files associated with sinks:
function _playSongs(){
	console.log("My genre is "+currentGenre+" and playing is "+backings[currentGenre].playing());
	// If backing is not playing, play it:
	if (backings[currentGenre].playing() == false){
		backings[currentGenre].volume(backingVolume);
		backings[currentGenre].play();
	}
	// Resets id of nodes being played:
	playingNodes = [];
	let firstPlayed = true;
	// Resets visual indication of notes:
	document.getElementById('note-count-value').textContent = "";
	// Play sound of sinks:
	nodes.forEach(function(item){
		if (item.sink == true){
			// Seek and play according to offset. If node is the first in this genre, also adds an additional offset:
			music[item.id].seek(-(1*item.offset + transitionOffset));
			music[item.id].play();
			playingNodes.push(item.id);
			// Adds note count to menu. Checks if this is the first text being added:
			if (playingNodes.length == 1){
				document.getElementById('note-count-value').textContent += item.noteCount;
			} else {
				document.getElementById('note-count-value').textContent += ("; " + item.noteCount);
			}
			// If this is the first sink playing in this orientation:
			if (firstPlayed){
				// Make it stand out:
				music[item.id].volume(phraseVolume);
				firstPlayed = false;
			} else {
				music[item.id].volume(poliphonyVolume);
			}
			// If this is a transitional node, switch genres:
			if (item.transitional == true){
				// Fades previous backing track:
				backings[currentGenre].fade(backingVolume, 0, 200);
				// Calculates the rate at which it should be played, according to the current genre:
				transitRate = serInterval[item.genre] / serInterval[currentGenre];
				// Switch genres:
				isTransitioning = true;
			}
		}
	});
	// Resets transition offset accordingly:
	transitionOffset = 0;
}

// Switches between genres. Blues is 1, jazz is 2:
function _switchGenre(){
	// Checks if current genre is blues:
	if (currentGenre == 1){
		// Switches to jazz:
		currentGenre = 2;
	} else {
		// Switches to blues:
		currentGenre = 1;
	}
	// Signals that a additional waiting time is needed for the next node:
	transitionOffset = 0.2;
}

// Toggles border (blues, jazz, transit) overlay:
function toggleBorders(){
	borderNodes.forEach(function(item){
		if (item.hidden == true){
			item.hidden = false;
		} else {
			item.hidden = true;
		}
		borderNodes.update(item);
	});
}

function increaseScale(){
	currentScale += 0.1;
	network.moveTo({scale: currentScale});
	bordersNetwork.moveTo({scale: currentScale});
}


function decreaseScale(){
	currentScale -= 0.1;
	network.moveTo({scale: currentScale});
	bordersNetwork.moveTo({scale: currentScale});
}

window.onload = function(){
	createNetwork();
}
