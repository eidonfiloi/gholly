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

let labelDistance = 0;
let nominal_base_node_size = 8;
let nominal_text_size = 10;
let max_text_size = 24;
let nominal_stroke = 1.5;
let max_stroke = 4.5;
let max_base_node_size = 36;
let min_zoom = 0.1;
let max_zoom = 10;

let testNetworkShape = [10,40,10]
let network = new Network(testNetworkShape);

let nodes = network.nodes;
let links = network.activeLinks();

let svg = d3.select("#network")
            //.append("div")
            .classed("svg-container", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 600 400")
             //class to make it responsive
            .classed("svg-content-responsive", true); 
            
let g = svg.append("g");

let zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom]);
/*let zoomListener = d3.behavior.zoom()
                              .scaleExtent([min_zoom,max_zoom]);*/

let force = d3.layout.force()
    .charge(-400)
    .linkDistance(400)
    .linkStrength(function(l:Link,i){return 2*l.weight -1;})
    .gravity(0.5)
    .on("tick", tick);

let drag = force.drag()
    .on("dragstart", dragstart);

let link = g.selectAll(".link");
let node = g.selectAll(".node");

force
  .nodes(nodes)
  .links(links)
  .start();

link = link
		.data(links)
		.enter().append("line")
  		.attr("class", "link")
      .style("stroke", function (d) { return '#673AB7'; })
  		.style("stroke-width", function(d:Link) { return Math.sqrt(d.weight)});

link.style( "stroke-dasharray", "10,10" )
  .each( animLink );

node = node.data(nodes)
.enter().append("circle")
  .style("fill", function (d) { return '#E91C63'; })
  .attr("class", "node")
  .attr("r", 12)
  .on("dblclick", dblclick)
  .call(drag);

zoom.on("zoom", redraw);  
//zoomListener.on("zoom",() => zoomHandler());

svg.call(zoom);
// resize();
// d3.select(window).on("resize", resize);

/*function zoomHandler(value: number): void {
  g.attr("transform",
      "translate(" + zoomListener.translate() + ")"
      + " scale(" + zoomListener.scale() + ")");
}*/

function redraw() {
  let evt: d3.ZoomEvent = <d3.ZoomEvent> d3.event;
  g.attr("transform",
      "translate(" + evt.translate + ")"
      + " scale(" + evt.scale + ")");
}

function animLink( d ) {
	d3.select(this)
		.transition()
			.delay(0)
			.duration(10000)
			.ease( "linear" )
			.attrTween( "stroke-dashoffset", function() {
				let i = d3.interpolateString( "250", "0" );
				return function(t) { return i(t); };
			} )
		//.each( "end", animLink)
	;
}

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

// function resize() {
//     // let width = window.innerWidth*0.7; 
//     // let height = window.innerHeight*0.9;
//     let width = d3.select("#network")[0][0].clientWidth; 
//     let height = d3.select("#network")[0][0].clientHeight;
//     svg.attr("width", width).attr("height", height);
//     force.size([width, height]).resume();
//   }