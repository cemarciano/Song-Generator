var network, data;
var options = {
	layout:{randomSeed:30},
	physics: {enabled: false}
};
var nodeColor = "#ffffff";
var nodeFontColor = "#000000";
var sinkColor = "#000000";
var sinkFontColor = "#ffffff";
var container;
var music = [];
var musicFadeOut = 400;


// create an array with nodes
var nodes = new vis.DataSet([
	{id: 1, label: '1', x: 260, y: 0},
	{id: 2, label: '2', x: 130, y: -150},
	{id: 3, label: '3', x: 0, y: -150},
	{id: 4, label: '4', x: -130, y: -150},
	{id: 5, label: '5', x: -260, y: -150},
	{id: 6, label: '6', x: -130, y: 0},
	{id: 7, label: '7', x: -260, y: 0},
	{id: 8, label: '8', x: -260, y: 150},
	{id: 9, label: '9', x: -130, y: 150},
	{id: 10, label: '10', x: 0, y: 150},
	{id: 11, label: '11', x: 130, y: 150},
	{id: 12, label: '12', x: 0, y: 250},
	{id: 13, label: '13', x: 130, y: 0},
	{id: 14, label: '14', x: 260, y: -150}
]);


// create an array with edges
var edges = new vis.DataSet([
	{from: 2, to: 1},
	{from: 13, to: 1},
	{from: 11, to: 1},
	{from: 14, to: 1},
	{from: 3, to: 2},
	{from: 13, to: 3},
	{from: 6, to: 3},
	{from: 4, to: 3},
	{from: 6, to: 4},
	{from: 5, to: 4},
	{from: 6, to: 5},
	{from: 7, to: 5},
	{from: 7, to: 6},
	{from: 9, to: 6},
	{from: 8, to: 7},
	{from: 9, to: 8},
	{from: 10, to: 9},
	{from: 12, to: 10},
	{from: 11, to: 10}

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
	// Play first sound track:
	_playSongs();

	network.on("click", function (params) {
		runSER();
	});

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
	// Initializes music:
	nodes.forEach(function(item){
		music[item.id] = new Howl({
			src: ['chords/' + item.id + '.mp3'],
			autoplay: false,
			loop: false,
			preload: true
		});
	});
}

// Play sound files associated with sinks:
function _playSongs(){
	// Stops all current sounds:
	music.forEach(function(item){
		if (item.playing() == true){
			console.log(item);
			item.once( 'fade', () => { item.stop(); });
			item.fade(1, 0, musicFadeOut);
		}
	});
	// Play sound of sinks:
	nodes.forEach(function(item){
		if (item.sink == true){
			music[item.id].play();
			music[item.id].fade(0, 1, musicFadeOut);
		}
	});
}

createNetwork();
