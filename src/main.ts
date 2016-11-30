// /* Copyright 2016 Gholly All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ==============================================================================*/
// /// <reference path="../typings/index.d.ts" />

// import * as nn from "./nn";
// import {HeatMap, reduceMatrix} from "./heatmap";
// import {Node, Link, Network} from "./nn";

// const RECT_SIZE = 15;
// const DENSITY = 100;
// let iter = 0;
// let trainData = [];
// let linkWidthScale = d3.scale.linear()
//   .domain([0, 5])
//   .range([1, 10])
//   .clamp(true);
// let colorScale = d3.scale.linear<string>()
//                      .domain([0, .5, 1])
//                      .range(["#0877bd","#f59322", "#F53C22"])
//                      .clamp(true);

// let selectedNodeId: string = null;
// // Plot the heatmap.
// let xDomain: [number, number] = [-6, 6];
// let heatMap =
//     new HeatMap(300, DENSITY, xDomain, xDomain, d3.select("#heatmap"),
//         {showAxes: true});

// class Player {
//   private timerIndex = 0;
//   private isPlaying = false;
//   private callback: (isPlaying: boolean) => void = null;

//   /** Plays/pauses the player. */
//   playOrPause() {
//     if (this.isPlaying) {
//       this.isPlaying = false;
//       this.pause();
//     } else {
//       this.isPlaying = true;
      
//       this.play();
//     }
//   }

//   onPlayPause(callback: (isPlaying: boolean) => void) {
//     this.callback = callback;
//   }

//   play() {
//     this.pause();
//     this.isPlaying = true;
//     if (this.callback) {
//       this.callback(this.isPlaying);
//     }
//     this.start(this.timerIndex);
//   }

//   pause() {
//     this.timerIndex++;
//     this.isPlaying = false;
//     if (this.callback) {
//       this.callback(this.isPlaying);
//     }
//   }

//   private start(localTimerIndex: number) {
//     d3.timer(() => {
//       if (localTimerIndex < this.timerIndex) {
//         return true;  // Done.
//       }
//       oneStep();
//       return false;  // Not done.
//     }, 0);
//   }
// }

// let player = new Player();


// function makeGUI() {
//   d3.select("#reset-button").on("click", () => {
//     reset();
//     d3.select("#play-pause-button");
//   });

//   d3.select("#play-pause-button").on("click", function () {
//     // Change the button's content.
//     player.playOrPause();
//   });

//   player.onPlayPause(isPlaying => {
//     d3.select("#play-pause-button").classed("playing", isPlaying);
//   });

//   d3.select("#next-step-button").on("click", () => {
//     player.pause();
//     oneStep();
//   });

//   let mEdges = d3.select("#mEdges").on("change", function() {
//     network.m = +this.value;
//   });
//   mEdges.property("value", network.m);
// }

// function reset(hard=false) {
  
//   player.pause();


//   let suffix = (network.numLayers - 2) !== 1 ? "s" : "";
//   d3.select("#layers-label").text("Hidden layer" + suffix);
//   d3.select("#num-layers").text((network.numLayers - 2));

//   // Make a simple network.
//   if(hard) {
//   	iter = 0;
//   	network = new Network(testNetworkShape);
//   }
//   drawSankey(network);
//   updateUI();
// };

// function drawSankey(network: Network): void {
// 	console.log(network);
// 	let svg = d3.select("#svg");
//   // Remove all svg elements.
//   svg.select("g.core").remove();
//   // Remove all div elements.
//   d3.select("#network").selectAll("div.canvas").remove();
//   d3.select("#network").selectAll("div.plus-minus-neurons").remove();
 

//   // Get the width of the svg container.
//   let padding = 3;
//   let co = <HTMLDivElement> d3.select(".column.output").node();
//   let cf = <HTMLDivElement> d3.select(".column.features").node();
//   let width = co.offsetLeft - cf.offsetLeft;
//   svg.attr("width", width);

//   console.log("co",co,"cf",cf,"width",width);
 
//   // Map of all node coordinates.
//   let node2coord: {[id: string]: {cx: number, cy: number}} = {};
//   let container = svg.append("g")
//     .classed("core", true)
//     .attr("transform", `translate(${padding},${padding})`);
//   // Draw the network layer by layer.
//   let numLayers = network.numLayers;
//   let featureWidth = 118;
//   let layerScale = d3.scale.ordinal<number, number>()
//       .domain(d3.range(1, 6*numLayers-6))
//       .rangePoints([featureWidth, width - RECT_SIZE]);
//   let nodeIndexScale = (nodeIndex: number) => nodeIndex * (RECT_SIZE + 25);

//   // Draw the input layer separately.
//   let cx = RECT_SIZE / 2 + 50;
//   let inputNodes = network.network[0]
//   let maxY = nodeIndexScale(inputNodes.length);
//   inputNodes.forEach((node, i) => {
//     let cy = nodeIndexScale(i) + RECT_SIZE / 2;
//     node2coord[node.id+"_out"] = {cx: cx, cy: cy};
//     drawNode(cx, cy, node.id+"_out", true, container);
//   });

//   // Draw the intermediate layers.
//   for (let layerIdx = 1; layerIdx < numLayers; layerIdx++) {
//     let numNodes = network.network[layerIdx].length;
//     let cx_in = layerScale(6*layerIdx-2) + RECT_SIZE / 2;
//     let cx_out = layerScale(6*layerIdx-4) + RECT_SIZE / 2;
//     maxY = Math.max(maxY, nodeIndexScale(numNodes));
//     addPlusMinusControl(layerScale(6*layerIdx-3), layerIdx);
//     //addEdgeControl(layerScale(layerIdx) + 10, layerIdx);
//     //rewireEdgeControl(layerScale(layerIdx) + 20, layerIdx);
//     for (let i = 0; i < numNodes; i++) {
//       let node = network.network[layerIdx][i];
//       let cy = nodeIndexScale(i) + RECT_SIZE / 2;
//       node2coord[node.id+"_in"] = {cx: cx_in, cy: cy};
//       drawNode(cx_in, cy, node.id+"_in", false, container, node); 
//       node2coord[node.id+"_out"] = {cx: cx_out, cy: cy};
//       drawNode(cx_out, cy, node.id+"_out", false, container, node);  
//     }

//     for(let i = 0; i < numNodes; i++) {
//     	let node = network.network[layerIdx][i];

//     	// Draw links.
//       for (let j = 0; j < node.inputLinks.length; j++) {
//         let link = node.inputLinks[j];
//         if(link.isActive) {
//         	let path: SVGPathElement = <any> drawLink(link, node2coord, network.network,
//             container, j === 0, j, node.inputLinks.length).node();
// 	        // Show callout to weights.
// 	        let prevLayer = network.network[layerIdx - 1];
// 	        let lastNodePrevLayer = prevLayer[prevLayer.length - 1];
//         }
//       }
//     }
//   }

//  //  // Draw the output nodes separately.
//  //  cx = width + RECT_SIZE / 2;
//  //  let outputNodes = network.network[numLayers - 1];
//  //  let cy = nodeIndexScale(0) + RECT_SIZE / 2;
//  //  outputNodes.forEach((node, i) => {
//  //    let cy = nodeIndexScale(i) + RECT_SIZE / 2;
//  //    node2coord[node.id] = {cx: cx, cy: cy};
//  //    drawNode(cx, cy, node.id, true, container);

//  //    for (let i = 0; i < node.inputLinks.length; i++) {
// 	//     let link = node.inputLinks[i];
// 	//     if(link.isActive) {
// 	//     	drawLink(link, node2coord, network.network, container, i === 0, i,
// 	//         node.inputLinks.length);
// 	//     } 
// 	// }
//  //  });
//   // Draw links.
  

//   let height = 600;

//   // Adjust the height of the svg.
//   svg.attr("height", maxY);

//   // Adjust the height of the features column.
//   d3.select(".column.features").style("height", height + "px");

// }

// function updateLinkUI(network: Network, container: d3.Selection<any>) {
// 	console.log(iter);
//   for (let layerIdx = 1; layerIdx < network.network.length; layerIdx++) {
//     let currentLayer = network.network[layerIdx];
//     // Update all the nodes in this layer.
//     for (let i = 0; i < currentLayer.length; i++) {
//       let node = currentLayer[i];
//       for (let j = 0; j < node.inputLinks.length; j++) {
//         let link = node.inputLinks[j];
//         if(link.isActive) {
//         	container.select(`#link${link.source.id}-${link.target.id}`)
//             .style({
//               "stroke-dashoffset": -iter / 3,
//               "stroke-width": linkWidthScale(Math.abs(link.weight)),
//               "stroke": colorScale(2*link.weight-1)
//             })
//             .datum(link);
//         }
//       }
//     }
//   }
// }

// function drawNode(cx: number, cy: number, nodeId: string, isInput: boolean,
//     container: d3.Selection<any>, node?: nn.Node) {
//   let x = cx - RECT_SIZE / 2;
//   let y = cy - RECT_SIZE / 2;

//   let nodeGroup = container.append("g")
//     .attr({
//       "class": "node",
//       "id": `node${nodeId}`,
//       "transform": `translate(${x},${y})`
//     });

//   // Draw the main rectangle.
//   nodeGroup.append("rect")
//     .attr({
//       x: 0,
//       y: 0,
//       width: RECT_SIZE,
//       height: RECT_SIZE,
//     });

//     // Draw the node's canvas.
//   let div = d3.select("#network").insert("div", ":first-child")
//     .attr({
//       "id": `canvas-${nodeId}`,
//       "class": "canvas"
//     })
//     .style({
//       position: "absolute",
//       left: `${x + 3}px`,
//       top: `${y + 3}px`
//     });
//     div.style("cursor", "pointer");
  
//   let nodeHeatMap = new HeatMap(RECT_SIZE, DENSITY / 10, xDomain,
//       xDomain, div, {noSvg: true});
//   div.datum({heatmap: nodeHeatMap, id: nodeId});
// }

// function drawLink(
//     input: nn.Link, node2coord: {[id: string]: {cx: number, cy: number}},
//     network: nn.Node[][], container: d3.Selection<any>,
//     isFirst: boolean, index: number, length: number) {
//   let line = container.insert("path", ":first-child");
//   let source = input.sameLayerLink() ? node2coord[input.source.id + "_in"] : node2coord[input.source.id + "_out"];
//   let dest = input.sameLayerLink() ? node2coord[input.target.id + "_out"] : node2coord[input.target.id + "_in"];
  
//   let datum = {
//     source: {
//       y: source.cx + RECT_SIZE / 2 + 2,
//       x: source.cy
//     },
//     target: {
//       y: dest.cx - RECT_SIZE / 2,
//       x: dest.cy + ((index - (length - 1) / 2) / length) * 12
//     }
//   };
//   let diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);
//   line.attr({
//     "marker-start": "url(#markerArrow)",
//     class: "link",
//     id: "link" + input.source.id + "-" + input.target.id,
//     d: diagonal(datum, 0)
//   });

//   // Add an invisible thick link that will be used for
//   // showing the weight value on hover.
//   container.append("path")
//     .attr("d", diagonal(datum, 0))
//     .attr("class", "link-hover");
//   return line;
// }

// function addPlusMinusControl(x: number, layerIdx: number) {
//   let div = d3.select("#network").append("div")
//     .classed("plus-minus-neurons", true)
//     .style("left", `${x-20}px`);

//   let i = layerIdx - 1;
//   let firstRow = div.append("div").attr("class", `ui-numNodes${layerIdx}`);

//   firstRow.append("button")
//       .attr("class", "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab")
//       .on("click", () => {
//         //let numNeurons = network.network[i].length;
//         network.rewireEdges(i);
//         reset();
//       })
//       .append("i")
//       .attr("class", "material-icons")
//       .text("shuffle");

//   firstRow.append("button")
//       .attr("class", "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab")
//       .on("click", () => {
//         //let numNeurons = network.network[i].length;
//         network.addEdges(i);
//         reset();
//       })
//       .append("i")
//       .attr("class", "material-icons")
//       .text("reorder");

//   firstRow.append("button")
//       .attr("class", "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab")
//       .on("click", () => {
//         //let numNeurons = network.network[i].length;
//         network.addNeuron(i);
//         reset();
//       })
//     .append("i")
//       .attr("class", "material-icons")
//       .text("add");

//   firstRow.append("button")
//       .attr("class", "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab")
//       .on("click", () => {
//         let numNeurons = network.network[i].length;
//         if (numNeurons <= 1) {
//           return;
//         }
//         network.removeNeuron(i);
//         reset();
//       })
//     .append("i")
//       .attr("class", "material-icons")
//       .text("remove");

//   // let suffix = network.network[i].length > 1 ? "s" : "";
//   // div.append("div").text(
//   //   network.network[i].length + " neuron" + suffix
//   // );
// }

// function updateUI() {
//   // Update the links visually.
//   updateLinkUI(network, d3.select("g.core"));

//   // Update all decision boundaries.
//   d3.select("#network").selectAll("div.canvas")
//       .each(function(data: {heatmap: HeatMap, id: string}) {
//       	let currentNode = network.getNode(data.id.split("_")[0]);
//       	data.heatmap.updateHeatMapBackground(currentNode);
//   });

//   function zeroPad(n: number): string {
//     let pad = "000000";
//     return (pad + n).slice(-pad.length);
//   }

//   function addCommas(s: string): string {
//     return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   }

//   function humanReadable(n: number): string {
//     return n.toFixed(3);
//   }

//   // Update loss and iteration number.
  
//   d3.select("#iter-number").text(addCommas(zeroPad(iter)));
// }

// function oneStep(): void {
//   iter++;
//   // trainData.forEach((point, i) => {
//   //   let input = constructInput(point.x, point.y);
//   //   nn.forwardProp(network, input);
//   //   nn.backProp(network, point.label, nn.Errors.SQUARE);
//   //   if ((i + 1) % state.batchSize === 0) {
//   //     nn.updateWeights(network, state.learningRate, state.regularizationRate);
//   //   }
//   // });
//   // // Compute the loss.
//   // lossTrain = getLoss(network, trainData);
//   // lossTest = getLoss(network, testData);
//   updateUI();
// }



// let testNetworkShape = [50,100,10]
// let network = new Network(testNetworkShape);

// makeGUI();
// reset(true);




/* Copyright 2016 Gholly All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
/// <reference path="../typings/index.d.ts" />

import * as nn from "./nn";
import {HeatMap, reduceMatrix} from "./heatmap";
import {Node, Link, Network} from "./nn";

let w = 960;
let h = 500;

let labelDistance = 0;

let testNetworkShape = [10,40,10]
let network = new Network(testNetworkShape);

let nodes = network.nodes;
let links = network.activeLinks();

var force = d3.layout.force()
    .size([w, h])
    .charge(-400)
    .linkDistance(400)
    .linkStrength(function(l:Link,i){return 2*l.weight -1;})
    .gravity(0.15)
    .on("tick", tick);

var drag = force.drag()
    .on("dragstart", dragstart);

var svg = d3.select("body").append("svg")
    .attr("width", w)
    .attr("height", h);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");



force
  .nodes(nodes)
  .links(links)
  .start();

link = link
		.data(links)
		.enter().append("line")
  		.attr("class", "link")
  		.style("stroke-width", function(d:Link) { return Math.sqrt(d.weight)});

node = node.data(nodes)
.enter().append("circle")
  .attr("class", "node")
  .attr("r", 12)
  .on("dblclick", dblclick)
  .call(drag);

function animLink( d ) {
	d3.select(this)
		.transition()
			.delay(0)
			.duration(10000)
			.ease( "linear" )
			.attrTween( "stroke-dashoffset", function() {
				var i = d3.interpolateString( "250", "0" );
				return function(t) { return i(t); };
			} )
		.each( "end", animLink)
	;
}

link.style( "stroke-dasharray", "10,10" )
	.each( animLink );


function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function dblclick(d) {
  d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
  d3.select(this).classed("fixed", d.fixed = true);
}
