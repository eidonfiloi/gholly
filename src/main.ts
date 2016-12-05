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
import {NodeType, NodeState, Node, Link, Network} from "./nn";
import {TestImage} from "./dataIO";
import {AppendingLineChart} from "./linechart";
import {HistogramChart} from "./histogramchart";

const DENSITY = 100;

const COLOR_CYAN = "#00BCD4";
const COLOR_LIGHT_BLUE = "#03A9F4";
const COLOR_BLUE = "#2196F3";
const COLOR_INDIGO = "#3F51B5";
const COLOR_DEEP_PURPLE = "#673AB7";
const COLOR_PURPLE = "#9C27B0";
const COLOR_PINK = "#E91E63";
const COLOR_RED = "#F44235";
const COLOR_DEEP_ORANGE = "#FF5622";
const COLOR_ORANGE = "#FF9800";
const COLOR_AMBER = "#FFC107";
const COLOR_YELLOW = "#FFEB3B";
const COLOR_LIGHT_GREEN = "#8BC34A";
const COLOR_GREY = "#9E9E9E";


let labelDistance = 0;
let nominal_base_node_size = 8;
let nominal_text_size = 10;
let max_text_size = 24;
let nominal_stroke = 1.5;
let max_stroke = 4.5;
let max_base_node_size = 36;
let min_zoom = 0.1;
let max_zoom = 10;
let xDomain: [number, number] = [-6, 6];
let dataIOHandler = new TestImage();




let testNetworkShape = [150,100,10]
let network = new Network(testNetworkShape);
console.log(network);
console.log(network.activeLinks());

let iter = 0;

let actLineChart = new AppendingLineChart(d3.select("#actLinechart"),
    ["#FBFBFB"]);

let actLineChart2 = new AppendingLineChart(d3.select("#actLinechart2"),
    ["#FBFBFB","#00BCD4","#FFC107"]);

let inputHeatMap =
    new HeatMap(150, DENSITY, xDomain, xDomain, "#inputHeatMap",
        {showAxes: false});

let histDataTest = [1,2,3,4,5,2,3,4,5,7,8,6,5,2,3,1,4,3,2,1,5,4,3,6,7,5,4,5,3,3,3,3,3,2,2,3,3,4,5,6,6,6,7,7,7,6,6];

let histChart = new HistogramChart(d3.select("#histChart"),histDataTest,5,"#00BCD4");


// D3 GRAPH
let svg = d3.select("#network")
            //.append("div")
            .classed("svg-container", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 600 400")
             //class to make it responsive
            .classed("svg-content-responsive", true); 
            
let g = svg.append("g").attr("id","network-g-core");


let zoom = d3.behavior.zoom()
                      .scaleExtent([min_zoom,max_zoom])
                      .on("zoom", redraw);
/*let zoomListener = d3.behavior.zoom()
                              .scaleExtent([min_zoom,max_zoom]);*/

svg.call(zoom);

let force = d3.layout.force<Node>()
    .charge(-400)
    .linkDistance(400)
    //.linkStrength(function(l:Link,i){return 2*l.weight -1;})
    .gravity(0.5)
    .nodes(network.hiddenNodes())
    .links(network.activeLinks())
    .on("tick", tick);

let drag = force.drag()
    .on("dragstart", dragstart);

let node: d3.selection.Update<Node>;

let link: d3.selection.Update<d3.layout.force.Link<Node>>;

let nodes = force.nodes();
let links = force.links();

class Player {
  private timerIndex = 0;
  private isPlaying = false;
  private callback: (isPlaying: boolean) => void = null;

  /** Plays/pauses the player. */
  playOrPause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.pause();
    } else {
      this.isPlaying = true;
      
      this.play();
    }
  }

  onPlayPause(callback: (isPlaying: boolean) => void) {
    this.callback = callback;
  }

  play() {
    this.pause();
    this.isPlaying = true;
    if (this.callback) {
      this.callback(this.isPlaying);
    }
    this.start(this.timerIndex);
  }

  pause() {
    this.timerIndex++;
    this.isPlaying = false;
    if (this.callback) {
      this.callback(this.isPlaying);
    }
  }

  private start(localTimerIndex: number) {
    setInterval(() => {
      if (localTimerIndex < this.timerIndex) {
        return true;  // Done.
      }
      oneStep();
      return false;  // Not done.
    }, 150);
  }
}

let player = new Player();


function makeGUI() {
  d3.select("#reset-button").on("click", () => {
    reset(true);
    d3.select("#play-pause-button");
  });

  d3.select("#play-pause-button").on("click", function () {
    // Change the button's content.
    player.playOrPause();
  });

  player.onPlayPause(isPlaying => {
    d3.select("#play-pause-button").classed("playing", isPlaying);
  });

  d3.select("#next-step-button").on("click", () => {
    player.pause();
    oneStep();
  });

  drawNetwork(network);

  d3.select("#iter-number").text(addCommas(zeroPad(iter)));

  inputHeatMap.generateHeatMap([]);

}

function reset(hard=false) {
  
  player.pause();
  actLineChart.reset();
  actLineChart2.reset();
  // Make network anew
  if(hard) {
  	iter = 0;
  	network = new Network(testNetworkShape);
  }
  drawNetwork(network);
  updateUI();
};

function drawNetwork(network: Network): void {

  //force.stop();
  console.log(network);
  // svg.select("g").remove();
  // g = svg.append("g");

  nodes = network.hiddenNodes();
  links = network.activeLinks();

  force
      .nodes(nodes)
      .links(links);
     

  link = g.selectAll(".link")
      .data(links);

  console.log("link",link);

  link.enter().append("line")
    .attr("class", "link")
    .style("stroke", function (d) { return COLOR_DEEP_ORANGE; })
    .style("stroke-width", function(d:Link) { return Math.sqrt(d.weight)})
    .style("stroke-dasharray", "3,3")
    .each(animLink);  

  // Exit any old links.
  link.exit().remove();

  node = g.selectAll(".node")
    .data(nodes);

  node
    .enter()
    .append("circle")
    .attr("class", function(n:Node){
      if(n.type === NodeType.EXCITATORY) {
        return "node excitatory";
      } else {
        return "node inhibitory"
      }
    })
    .attr("r",function(n:Node){
      if(n.type === NodeType.EXCITATORY) {
        return 6;
      } else {
        return 10
      }
    })
    .style("fill","none")
    .style("stroke",function (n:Node) {
      if(n.type === NodeType.EXCITATORY) {
        if(n.state === NodeState.DEFAULT) {
        return COLOR_AMBER;
      } else if(n.state === NodeState.SPIKING) {
        return COLOR_RED;
      } else {
        return COLOR_GREY;
      }
      } else {
       if(n.state === NodeState.DEFAULT) {
        return COLOR_CYAN;
      } else if(n.state === NodeState.SPIKING) {
        return COLOR_PURPLE;
      } else {
        return COLOR_GREY;
      }
      }
    })
    .style("stroke-width",5)
    .on("dblclick", dblclick)
    .call(drag);

  

  // Exit any old nodes.
  node.exit()
      // .transition()
      // .attr("r", 0)
    .remove();

  force.start();
}

function oneStep(): void {
  iter++;
  // trainData.forEach((point, i) => {
  //   let input = constructInput(point.x, point.y);
  //   nn.forwardProp(network, input);
  //   nn.backProp(network, point.label, nn.Errors.SQUARE);
  //   if ((i + 1) % state.batchSize === 0) {
  //     nn.updateWeights(network, state.learningRate, state.regularizationRate);
  //   }
  // });
  // // Compute the loss.
  // lossTrain = getLoss(network, trainData);
  // lossTest = getLoss(network, testData);
  drawNetwork(network);
  updateUI();
}

function updateUI() {
  // Update the links visually.
  // updateLinkUI(network, d3.select("g.core"));

  inputHeatMap.generateHeatMap([]);

  // // Update all decision boundaries.
  // d3.select("#network").selectAll("div.canvas")
  //     .each(function(data: {heatmap: HeatMap, id: string}) {
  //     	let currentNode = network.getNode(data.id.split("_")[0]);
  //     	data.heatmap.updateHeatMapBackground(currentNode);
  // });

 
  // Update loss and iteration number.
  
  d3.select("#iter-number").text(addCommas(zeroPad(iter)));
  histChart.addData([Math.floor((Math.random() * 30) + 1)]);
  actLineChart.addDataPoint([Math.random()]);
  actLineChart2.addDataPoint([Math.random()*2,Math.random()*3,Math.random()]);
}

function zeroPad(n: number): string {
    let pad = "000000";
    return (pad + n).slice(-pad.length);
  }

  function addCommas(s: string): string {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function humanReadable(n: number): string {
    return n.toFixed(3);
  }






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
  //console.log("tick link",link);
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

makeGUI();

// function resize() {
//     // let width = window.innerWidth*0.7; 
//     // let height = window.innerHeight*0.9;
//     let width = d3.select("#network")[0][0].clientWidth; 
//     let height = d3.select("#network")[0][0].clientHeight;
//     svg.attr("width", width).attr("height", height);
//     force.size([width, height]).resume();
//   }