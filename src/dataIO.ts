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

export class Cifar10Sample implements DataIOBase {
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

		d3.json(this.input_data_path, function(error,dat) {
			if(error) console.log(error);

			this.input_dim = dat['dim']
			this.data = dat['data']
			this.data_size = this.data.length;

			let dx = this.input_dim[0];
			let dy = this.input_dim[1];

			let node = <HTMLElement>d3.select(this.container_name).node();
		    console.log(node);
		    let totalWidth = node.offsetWidth;
		    let totalHeight = node.offsetHeight;
		    let margin = {top: 0, right: 0, bottom: 0, left: 0};
		    let width = totalWidth - margin.left - margin.right;
		    let height = totalHeight - margin.top - margin.bottom;

			this.heatmap = new HeatMap(this.container_name, width, height, dx, dy);
		});		
	}

	nextData(increment: boolean = true, flatten: boolean = false): number[][] {
		if(increment) {
			return this.data[counter++ % this.data_size];
		} else {
			return this.data[counter % this.data_size];
		}
	}

	nextDataAndDisplay(increment: boolean = true) {
		let currentData = nextData(increment, false);
		this.heatmap.updateBackGround(currentData);
	}

	displayNextData(currentData: number[][]) {
		this.heatmap.updateBackGround(currentData);
	}
}