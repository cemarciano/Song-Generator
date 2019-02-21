// create an array with nodes
var nodes = new vis.DataSet([
	{id: 1, label: '1'},
	{id: 2, label: '2'},
	{id: 3, label: '3'},
	{id: 4, label: '4'},
	{id: 5, label: '5'},
	{id: 6, label: '6'},
	{id: 7, label: '7'},
	{id: 8, label: '8'},
	{id: 9, label: '9'},
	{id: 10, label: '10'}
]);


// create an array with edges
var edges = new vis.DataSet([
	{from: 2, to: 1},
	{from: 6, to: 1},
	{from: 9, to: 1},
	{from: 3, to: 2},
	{from: 10, to: 2},
	{from: 7, to: 3},
	{from: 4, to: 3},
	{from: 9, to: 4},
	{from: 5, to: 4},
	{from: 6, to: 5},
	{from: 10, to: 5},
	{from: 7, to: 6},
	{from: 8, to: 7},
	{from: 9, to: 8},
	{from: 10, to: 8}
]);

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
	// Updates who is sink:
	_updateSinks();
	// Updates colors of nodes:
	_updateColors();

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
			item.sink = true;
			nodes.update(item);
		} else {
			item.color = {};
			item.color.background = nodeColor;
			item.color.border = nodeFontColor;
			item.font = {};
			item.font.color = nodeFontColor;
			item.sink = true;
			nodes.update(item);
		}
	});
}

createNetwork();
