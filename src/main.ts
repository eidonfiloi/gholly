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
import {Node, Link, Network} from "./nn";

const RECT_SIZE = 10;

function drawSankey(network: Network): void {
	let svg = d3.select("#svg");
  // Remove all svg elements.
  svg.select("g.core").remove();
 
  // Get the width of the svg container.
  let padding = 3;

  let width = 720;
 
  svg.attr("width", width);

  // Map of all node coordinates.
  let node2coord: {[id: string]: {cx: number, cy: number}} = {};
  let container = svg.append("g")
    .classed("core", true)
    .attr("transform", `translate(${padding},${padding})`);
  // Draw the network layer by layer.
  let numLayers = network.numLayers;
  let featureWidth = 118;
  let layerScale = d3.scale.ordinal<number, number>()
      .domain(d3.range(1, numLayers - 1))
      .rangePoints([featureWidth, width - RECT_SIZE], 0.7);
  let nodeIndexScale = (nodeIndex: number) => nodeIndex * (RECT_SIZE + 25);

  // Draw the input layer separately.
  let cx = RECT_SIZE / 2 + 50;
  let inputNodes = network.network[0]
  let maxY = nodeIndexScale(inputNodes.length);
  inputNodes.forEach((node, i) => {
    let cy = nodeIndexScale(i) + RECT_SIZE / 2;
    node2coord[node.id] = {cx: cx, cy: cy};
    drawNode(cx, cy, node.id, true, container);
  });

  // Draw the intermediate layers.
  for (let layerIdx = 1; layerIdx < numLayers - 1; layerIdx++) {
    let numNodes = network.network[layerIdx].length;
    let cx = layerScale(layerIdx) + RECT_SIZE / 2;
    maxY = Math.max(maxY, nodeIndexScale(numNodes));
    for (let i = 0; i < numNodes; i++) {
      let node = network.network[layerIdx][i];
      let cy = nodeIndexScale(i) + RECT_SIZE / 2;
      node2coord[node.id] = {cx: cx, cy: cy};
      drawNode(cx, cy, node.id, false, container, node);


      
    }

    for(let i = 0; i < numNodes; i++) {
    	let node = network.network[layerIdx][i];

    	// Draw links.
      for (let j = 0; j < node.inputLinks.length; j++) {
        let link = node.inputLinks[j];
        let path: SVGPathElement = <any> drawLink(link, node2coord, network.network,
            container, j === 0, j, node.inputLinks.length).node();
        // Show callout to weights.
        let prevLayer = network.network[layerIdx - 1];
        let lastNodePrevLayer = prevLayer[prevLayer.length - 1];
  
      }
    }
  }

  // Draw the output node separately.
  cx = width + RECT_SIZE / 2;
  let outputNodes = network.network[numLayers - 1];
  let cy = nodeIndexScale(0) + RECT_SIZE / 2;
  outputNodes.forEach((node, i) => {
    let cy = nodeIndexScale(i) + RECT_SIZE / 2;
    node2coord[node.id] = {cx: cx, cy: cy};
    drawNode(cx, cy, node.id, true, container);

    for (let i = 0; i < node.inputLinks.length; i++) {
    let link = node.inputLinks[i];
    drawLink(link, node2coord, network.network, container, i === 0, i,
        node.inputLinks.length);
  }
  });
  // Draw links.
  

  let height = 600;

  // Adjust the height of the svg.
  svg.attr("height", maxY);

  // Adjust the height of the features column.
  d3.select(".column.features").style("height", height + "px");

}

function drawNode(cx: number, cy: number, nodeId: string, isInput: boolean,
    container: d3.Selection<any>, node?: nn.Node) {
  let x = cx - RECT_SIZE / 2;
  let y = cy - RECT_SIZE / 2;

  let nodeGroup = container.append("g")
    .attr({
      "class": "node",
      "id": `node${nodeId}`,
      "transform": `translate(${x},${y})`
    });

  // Draw the main rectangle.
  nodeGroup.append("rect")
    .attr({
      x: 0,
      y: 0,
      width: RECT_SIZE,
      height: RECT_SIZE,
    });
}

function drawLink(
    input: nn.Link, node2coord: {[id: string]: {cx: number, cy: number}},
    network: nn.Node[][], container: d3.Selection<any>,
    isFirst: boolean, index: number, length: number) {
	console.log(input,node2coord);
  let line = container.insert("path", ":first-child");
  let source = node2coord[input.source.id];
  let dest = node2coord[input.target.id];
  let datum = {
    source: {
      y: source.cx + RECT_SIZE / 2 + 2,
      x: source.cy
    },
    target: {
      y: dest.cx - RECT_SIZE / 2,
      x: dest.cy + ((index - (length - 1) / 2) / length) * 12
    }
  };
  let diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);
  line.attr({
    "marker-start": "url(#markerArrow)",
    class: "link",
    id: "link" + input.source.id + "-" + input.target.id,
    d: diagonal(datum, 0)
  });

  // Add an invisible thick link that will be used for
  // showing the weight value on hover.
  container.append("path")
    .attr("d", diagonal(datum, 0))
    .attr("class", "link-hover");
  return line;
}



let testNetworkShape = [10,20,15,10,5]

drawSankey(new Network(testNetworkShape));