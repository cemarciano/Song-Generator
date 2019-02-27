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
var backing;
var musicFadeOut = 400;

// Variables for visual placement of nodes:
var rowDist = 110;
var colDist = 130;
var transitSpacing = 30;

// create an array with nodes
var nodes = new vis.DataSet([
	{id: 1, label: '1', x: -(colDist + transitSpacing), y: -rowDist, file:"antec01"},
	{id: 2, label: '2', x: -(2*colDist + transitSpacing), y: -rowDist, file:"conseq01"},
	{id: 3, label: '3', x: -(2.8*colDist + transitSpacing), y: 0, file:"antec02"},
	{id: 4, label: '4', x: -(3.4*colDist + transitSpacing), y: -rowDist-15, file:"conseq02"},
	{id: 5, label: '5', x: -(2*colDist + transitSpacing), y: rowDist, file:"antec01"},
	{id: 6, label: '6', x: -(colDist + transitSpacing), y: rowDist},
	{id: 7, label: '7', x: 0, y: rowDist},
	{id: 8, label: '8', x: colDist + transitSpacing, y: rowDist},
	{id: 9, label: '9', x: 2*colDist + transitSpacing, y: rowDist+50},
	{id: 10, label: '10', x: 2*colDist + transitSpacing, y: rowDist-50},
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

	// Play first sound track:
	backing.on("load", function(){


		setTimeout(function(){
			_playSongs();
			setInterval(function(){
				runSER();
			},4800);
		}, 1000);
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
	// Initializes node music:
	nodes.forEach(function(item){
		music[item.id] = new Howl({
			src: ['phrases/' + item.file + '.mp3'],
			autoplay: false,
			loop: false,
			preload: true
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
}



// Play sound files associated with sinks:
function _playSongs(){
	// If backing is not playing, play it:
	if (backing.playing() == false){
		backing.play();
	}
	// Play sound of sinks:
	nodes.forEach(function(item){
		if (item.sink == true){
			music[item.id].play();
			if (item.id != 1){
			}
		}
	});
}

createNetwork();
