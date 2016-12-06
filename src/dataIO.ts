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

import {HeatMap, reduceMatrix} from "./heatmap";

export enum DataIOType {
  IMAGE,
  SOUND,
  TEXT,
  VECTOR
}

export interface DataIOBase {
	nextData: () => number[];
}

export class Cifar10Sample {
	type: DataIOType = DataIOType.IMAGE;
	input_data_path: string;
	input_dim: number[];
	data: number[][][];
	data_size: number;
	container_name: string;
	heatmap: HeatMap;
	counter: number;


	constructor(containerName: string, input_data_path: string = "resources/cifar10_1_int.json") {
		this.input_data_path = input_data_path;
		this.container_name = containerName;
		this.counter = 0;
		let node = <HTMLElement>d3.select(this.container_name).node();

		let that = this;
		d3.json(this.input_data_path, function(error,dat) {
			console.log("cifar", dat);
			if(error) console.log(error);

			that.input_dim = dat.dim;
			that.data = <number[][][]>dat.data;
			that.data_size = that.data.length;

			let dx = that.input_dim[0];
			let dy = that.input_dim[1];

		    let totalWidth = node.offsetWidth;
		    let totalHeight = node.offsetHeight;
		    let margin = {top: 0, right: 0, bottom: 0, left: 0};
		    let width = totalWidth - margin.left - margin.right;
		    let height = totalHeight - margin.top - margin.bottom;

			that.heatmap = new HeatMap(that.container_name, 64, 64, dx, dy);
		});		
	}

	nextData(increment: boolean = true, flatten: boolean = false): number[][] {
		if(increment) {
			return this.data[this.counter++ % this.data_size];
		} else {
			return this.data[this.counter % this.data_size];
		}
	}

	nextDataAndDisplay(increment: boolean = true) {
		let currentData = this.nextData(increment, false);
		this.heatmap.updateBackground(currentData);
	}

	displayNextData(currentData: number[][]) {
		this.heatmap.updateBackground(currentData);
	}
}