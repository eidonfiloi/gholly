/* Copyright 2016 Gholly Inc. All Rights Reserved.

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


/**
 * A multi-series line chart that allows you to append new data points
 * as data becomes available.
 */
export class HistogramChart {
  private numLines: number;
  public data: number[];
  public numBins: number;
  private svg: d3.Selection<any>;
  private g: d3.Selection<any>;
  private xScale: d3.scale.Linear<number, number>;
  private yScale: d3.scale.Linear<number, number>;
  private hist: d3.Selection<any>;
  private height: number;
  private color: string;

  constructor(container: d3.Selection<any>, data_: number[], numBins: number, color: string) {
    let node = <HTMLElement>container.node();
    console.log(node);
    let totalWidth = node.offsetWidth;
    let totalHeight = node.offsetHeight;
    let margin = {top: 2, right: 0, bottom: 2, left: 2};
    let width = totalWidth - margin.left - margin.right;
    this.height = totalHeight - margin.top - margin.bottom;
    this.data = data_;
    this.numBins = _.max(this.data,function(d){return d;});
    this.color = color;

    this.svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", this.height + margin.top + margin.bottom);

    this.g = this.svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    

    let bins = d3.layout.histogram()
    //.range([this.xScale.domain()[0],this.xScale.domain()[1]])
    .bins(this.numBins)(this.data);

    console.log(bins);

    this.xScale = d3.scale.linear()
      .domain([0,
        d3.max(bins, function(d:d3.layout.histogram.Bin<number>) { return d.x; })])
      .range([0, width]);
    this.yScale = d3.scale.linear()
      .domain([0, d3.max(bins, function(d:d3.layout.histogram.Bin<number>) { return d.length; })])
      .range([this.height, 0]);

    let x = this.xScale;
    let y = this.yScale;
    let height = this.height;

    this.hist = this.g.selectAll(".bar")
      .data(bins)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d:d3.layout.histogram.Bin<number>) { return "translate(" + x(d.x) + "," + y(d.length) + ")"; });

    this.hist.append("rect")
        .attr("x", 1)
        .attr("fill",this.color)
        .attr("width", this.xScale(bins[0].dx))
        .attr("height", function(d:d3.layout.histogram.Bin<number>) { return height - y(d.length); });

    /*this.hist.append("text")
        .attr("dy", ".75em")
        .attr("y", 6)
        .attr("x", this.xScale(bins[0].dx) / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { return d.length; });*/

    this.g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + this.height + ")");
    }

  reset() {
    this.data = [];
    this.redraw();
  }

  addData(moreData: number[]) {

    this.data = this.data.concat(moreData);
    console.log(this.data);
    this.redraw();
  }

  private redraw() {

    this.numBins = _.max(this.data,function(d){return d;});

    let bins = d3.layout.histogram()
    .bins(this.numBins)(this.data);
    console.log(bins);
    // Adjust the x and y domain.
    this.xScale.domain([0,
        d3.max(bins, function(d:d3.layout.histogram.Bin<number>) { return d.x; })])
    this.yScale.domain([0, d3.max(bins, function(d:d3.layout.histogram.Bin<number>) { return d.length; })]);

    let x = this.xScale;
    let y = this.yScale;
    let height = this.height;

    this.g.selectAll(".bar")
          .remove()
    
    this.hist = this.g.selectAll(".bar")
      .data(bins)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d:d3.layout.histogram.Bin<number>) { return "translate(" + x(d.x) + "," + y(d.length) + ")"; });

    this.hist.append("rect")
        .attr("x", 1)
        .attr("fill",this.color)
        .attr("width", this.xScale(bins[0].dx))
        .attr("height", function(d:d3.layout.histogram.Bin<number>) { return height - y(d.length); });

    // this.hist.append("text")
    //     .attr("dy", ".75em")
    //     .attr("y", 6)
    //     .attr("x", this.xScale(bins[0].dx) / 2)
    //     .attr("text-anchor", "middle")
    //     .text(function(d) { return d.length; });

    this.g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + this.height + ")");
  }
}