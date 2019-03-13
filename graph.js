var network, data;
var options = {
	layout:{randomSeed:30},
	physics: {enabled: false}
};
var nodeColor = "#ffffff";				// Background color of non-sink nodes
var nodeFontColor = "#000000";			// Font color of non-sink nodes
var sinkColor = "#000000";				// Background color of sink nodes
var sinkFontColor = "#ffffff";			// Font color of sink nodes
var container;							// Network DOM object
var music = [];							// Music object for each node
var backings = [undefined,undefined];	// Array of backing tracks
var backing;							// Backing track object
var musicFadeOut = 400;					// Music fade (ms)
var serInterval = [null, 4.815, 6.430];		// Waiting interval before next edge reversal (ms) sorted by genre (first is blues, second is jazz)
var poliphonyVolume = 0.55;				// Volume for poliphony tracks
var phraseVolume = 0.9;					// Volume for single phrases
var backingVolume = 1;					// Volume for backing track
var songsLoaded = 0;					// Counter of how many tracks have been loaded
var currentGenre = 1;					// Starting genre. 1 is blues, 2 is jazz
var serIterations = 0;					// Gets incremented by 1 everytime SER iterates
var playingNodes = [];					// Array of indexes of nodes being played;
var isTransitioning = false;			// True if a transitional node is playing;

// Variables for visual placement of nodes:
var rowDist = 110;				// Distance between rows
var colDist = 130;				// Distance between columns
var transitSpacing = 30;		// Extra distance from central transitional nodes

// create an array with nodes (offset measured in seconds)
var nodes = new vis.DataSet([
	{id: 1, label: '1', x: -(colDist + transitSpacing), y: -rowDist, file:"antec01", offset: -0.6},
	{id: 2, label: '2', x: -(2*colDist + transitSpacing), y: -rowDist, file:"conseq01", offset: -0.33},
	{id: 3, label: '3', x: -(2.8*colDist + transitSpacing), y: 0, file:"antec02", offset: -1},
	{id: 4, label: '4', x: -(3.4*colDist + transitSpacing), y: -rowDist-15, file:"conseq03", offset: -2.45},
	{id: 5, label: '5', x: -(2*colDist + transitSpacing), y: rowDist, file:"conseq02", offset: -3.6},
	{id: 6, label: '6', x: -(colDist + transitSpacing), y: rowDist, file:"antec03", offset: -2.7},
	{id: 7, label: '7', x: 0, y: rowDist, transitional: true, file:"trans01", offset: -1.45},
	{id: 8, label: '8', x: colDist + transitSpacing, y: rowDist, file:"jazz-antec01", offset: -1.9},
	{id: 9, label: '9', x: 2*colDist + transitSpacing, y: rowDist+55, file:"jazz-conseq01", offset: -2.15},
	{id: 10, label: '10', x: 2*colDist + transitSpacing, y: rowDist-55, file:"jazz-conseq02", offset: -1.8},
	{id: 11, label: '11', x: 3*colDist + transitSpacing, y: rowDist, file:"jazz-antec02", offset: -1.5},
	{id: 12, label: '12', x: 3*colDist + transitSpacing, y: -rowDist+80, file:"jazz-conseq03", offset: -2.95},
	{id: 13, label: '13', x: 2*colDist + transitSpacing, y: -rowDist, file:"jazz-conseq04", offset: -2.95},
	{id: 14, label: '14', x: colDist + transitSpacing, y: -rowDist},
	{id: 15, label: '15', x: 0, y: -rowDist, transitional: true}
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


}


// Function to be executed when the Play button is pressed:
function play(){
	// Removes loading screen:
	document.getElementById('loading-screen').remove();
	// Perform first round of SER and play first songs:
	setTimeout(function(){
		requestAnimationFrame(fire);
	}, 700);
}

// Main recurring function, being called every keyframe:
function fire(){
	// Checks if next iteration of SER should occur:
	if(backings[currentGenre].seek() >= serInterval[currentGenre]*serIterations){
		// Checks if a transition has just taken place:
		if (isTransitioning == true){
			// Stops current backing track:
			backings[currentGenre].stop();
			// Switches genres:
			_switchGenre();
			// Resets state variable:
			isTransitioning = false;
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
	if (songsLoaded == 15){
		// Display Play button after a few seconds:
		setTimeout(function(){
			// Creates play button:
			var playButton = document.createElement('div');
			playButton.className = "btn";
			playButton.innerHTML = "Play";
			playButton.onclick = play;
			// Fetches loading screen:
			var loadingScreen = document.getElementById('loading-screen');
			// Removes Loading... text:
			loadingScreen.innerHTML = "";
			// Appends play button:
			loadingScreen.appendChild(playButton);
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
	// Play sound of sinks:
	nodes.forEach(function(item){
		if (item.sink == true){
			// Seek and play according to offset:
			music[item.id].seek(-1*item.offset);
			music[item.id].play();
			playingNodes.push(item.id);
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
				// Switch genres:
				isTransitioning = true;
			}
		}
	});
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
}

window.onload = function(){
	createNetwork();
}
