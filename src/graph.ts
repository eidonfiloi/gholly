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

let testNetworkShape = [50,100,10]
let network = new Network(testNetworkShape);

let vis = d3.select("body").append("svg:svg").attr("width", w).attr("height", h);

let nodes = network.nodes;
let links = [];

let force = d3.layout.force()
				.size([w, h])
				.nodes(nodes)
				.links(links)
				.gravity(1)
				.linkDistance(50)
				.charge(-3000)
				.linkStrength(function(x:Link) {
					return x.weight * 10;
				});


force.start();

let link = vis.selectAll("line.link")
				.data(links)
				.enter()
				.append("svg:line")
				.attr("class", "link")
				.style("stroke", "#CCC");

let node = vis.selectAll("g.node")
				.data(force.nodes())
				.enter()
				.append("svg:g")
				.attr("class", "node");
node.append("svg:circle")
	.attr("r", 5)
	.style("fill", "#555")
	.style("stroke", "#FFF")
	.style("stroke-width", 3);
node.call(force.drag);

let updateLink = function() {
	this.attr("x1", function(d) {
		return d.source.x;
	}).attr("y1", function(d) {
		return d.source.y;
	}).attr("x2", function(d) {
		return d.target.x;
	}).attr("y2", function(d) {
		return d.target.y;
	});

}

let updateNode = function() {
	this.attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});

}

force.on("tick", function() {

	force.start();

	node.call(updateNode);

	link.call(updateLink);
});